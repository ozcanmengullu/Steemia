import { Injectable } from '@angular/core';
import { SteemConnectProvider } from 'providers/steemconnect/steemconnect';
import {
  METADATA,
  MAX_ACCEPTED_PAYOUT,
  PERCENT_STEEM_DOLLARS,
  OPERATIONS
} from '../../constants/constants';
import { SocialSharing } from '@ionic-native/social-sharing';

@Injectable()
export class SteeemActionsProvider {

  private access_token: string;
  private username: string = '';
  private options: Object;

  constructor(private steemConnect: SteemConnectProvider,
    private socialShare: SocialSharing) {

    // Subscribe to the logged in user so the broadcast actions can work
    this.steemConnect.status.subscribe(res => {
      if (res.status === true) {
        this.username = res.userObject.user;
      }
    });
  }

  public mock_transaction() {
    if (this.username === '' || this.username === null || this.username === undefined) {
      return Promise.resolve('not-logged');
    }

    return this.steemConnect.instance.follow(this.username, '');
  }

  /**
   * Public method to dispatch a vote/unvote
   * @param {String} type
   * @param {String} author 
   * @param {String} permlink 
   * @param {Number} weight 
   * @returns returns a promise
   */
  public dispatch_vote(type: string, author: string, permlink: string, weight: number = 10000) {

    if (this.username === '' || this.username === null || this.username === undefined) {
      return Promise.resolve('not-logged');
    }

    let url: string;
    if (type === 'posts') {
      url = permlink.split('/')[3];
    }

    else if (type === 'comment') {
      url = permlink.split('/')[4];
    }

    return this.steemConnect.instance.vote(this.username, author, url, weight);
  }

  /**
   * Method to dispatch a follow
   * @param {String} user_to_follow 
   * @returns returns a promise
   */
  public dispatch_follow(user_to_follow: string) {

    if (this.username === '' || this.username === null || this.username === undefined) {
      return Promise.resolve('not-logged');
    }

    return this.steemConnect.instance.follow(this.username, user_to_follow);
  }

  /**
   * Method to dispatch an unfollow
   * @param {String} user_to_unfollow 
   * @returns returns a promise
   */
  public dispatch_unfollow(user_to_unfollow: string) {

    if (this.username === '' || this.username === null || this.username === undefined) {
      return Promise.resolve('not-logged');
    }

    return this.steemConnect.instance.unfollow(this.username, user_to_unfollow);
  }

  public dispatch_mute() {

  }

  /**
   * Method to dispatch a reblog
   * @param {String} author 
   * @param {String} permlink 
   */
  public dispatch_reblog(author, permlink) {

    let url = permlink.split('/')[3];

    if (this.username === '' || this.username === null || this.username === undefined) {
      return Promise.resolve('not-logged');
    }

    return this.steemConnect.instance.reblog(this.username, author, url);
  }

  /**
   * Method to claim pending rewards
   * @param rewardSteem 
   * @param rewardSbd 
   * @param rewardVests 
   */
  public dispatch_claim_reward(rewardSteem, rewardSbd, rewardVests) {

    if (this.username === '' || this.username === null || this.username === undefined) {
      return Promise.resolve('not-logged');
    }

    return this.steemConnect.instance.claimRewardBalance(this.username, rewardSteem, rewardSbd, rewardVests);
  }

  /**
   * Method to dispatch a comment
   * @param {String} author 
   * @param {String} permlink 
   * @param {String} body 
   */
  public dispatch_comment(author, permlink, body) {

    if (this.username === '' || this.username === null || this.username === undefined) {
      return Promise.resolve('not-logged');
    }

    let url = permlink.split('/')[3];
    let permUrl = this.commentPermlink('', url);

    return this.steemConnect.instance.comment(author, url, this.username, permUrl, '', body, METADATA);

  }

  /**
   * Method to dispatch a post
   * @param {String} title 
   * @param {String} description 
   * @param {Array<string>} tags 
   */
  public dispatch_post(title: string, description: string, tags: Array<string>, upvote?: boolean, rewards?: string) {

    // Create the permlink for the new post
    let permlink = title.replace(/[^\w\s]/gi, '').replace(/\s\s+/g, '-').replace(/\s/g, '-').toLowerCase();

    // If the user didn't insert any tag, create an empty array
    if (tags === undefined || tags === null) {
      tags = [];
    }

    // Push the tag Steemia to the post
    tags.push('steemia');


    let jsonMetadata = { tags: tags, app: `steemia/0.1`, format: 'markdown' };

    // Create empty array for the operations
    const operations = [];

    // Create the object for the post
    const commentOp = [
      OPERATIONS.COMMENT,
      {
        parent_author: '', // Since it is a post, parent author is empty
        parent_permlink: tags[0], // Parent permlink will be the 0th index in the tags array
        author: this.username, // Author is the current logged in username
        permlink: permlink, // Permlink of the post
        title: title, // Title of the post
        body: description, // Description of the post
        json_metadata: this.create_json_metadata(tags), // JSON string with the tags, app, and format
      },
    ];
    operations.push(commentOp);

    const commentOptionsConfig = this.prepare_beneficiaries(permlink, rewards);

    operations.push(commentOptionsConfig);

    if (upvote) {
      const self_vote = this.prepare_self_vote(permlink);
      operations.push(self_vote);
    }

    return this.steemConnect.instance.broadcast(operations);
  }

  /**
   * Public method to dispatch a flag
   * @param {String} author 
   * @param {String} permlink
   * @returns returns a promise
   */
  public dispatch_flag(author: string, permlink: string) {

    if (this.username === '' || this.username === null || this.username === undefined) {
      return Promise.resolve('not-logged');
    }

    let url = permlink.split('/')[3];

    return this.steemConnect.instance.vote(this.username, author, url, -1000);
  }

  /**
   * Public method to dispatch a social sharing
   * @param {String} permlink 
   * @returns returns a promise
   */
  public dispatch_share(permlink) {

    let url = 'https://steemit.com' + permlink;
    return this.socialShare.share('Hey, check this amazing post: ' + url + ' And download Steemia app from {url} #steemia')

  }

  /**
   * Method to create JSONMetadata with tags and app info
   * @param {Array} tags 
   * @returns returns a stringify JSON with tags and app info
   */
  private create_json_metadata(tags: Array<string>): string {

    return JSON.stringify({
      tags: tags,
      app: 'steemia/0.0.1'
    });
  }

  /**
   * Method to prepare beneficiaries for the post
   * @param {String} permlink 
   * @returns returns an array with the operation and data
   */
  private prepare_beneficiaries(permlink: string, rewardOption: string): Array<any> {

    let beneficiariesObject = {
      author: this.username,
      permlink: permlink,
      allow_votes: true,
      allow_curation_rewards: true,
      max_accepted_payout: MAX_ACCEPTED_PAYOUT,
      percent_steem_dollars: PERCENT_STEEM_DOLLARS,
      extensions: [
        [
          0, {
            beneficiaries: [
              {
                account: 'steemia-io',
                weight: 1000 // 10% for Steemia-io
              },
              {
                account: 'steepshot',
                weight: 1000 // 10% for Steepshot
              },
              {
                account: 'steemia.pay',
                weight: 500 // 5% for steemia.pay
              }
            ]
          }
        ]
      ]
    };

    // Decline Payment
    if (rewardOption === '0%') {
      beneficiariesObject.max_accepted_payout = '0.000 SBD';
    } 

    // 100% power up
    else if (rewardOption === '100%') {
      beneficiariesObject.percent_steem_dollars = 0;
    }

    return [OPERATIONS.COMMENT_OPTIONS, beneficiariesObject];
  }

  /**
   * Method to selfupvote after posting a post
   * @param {String} permlink
   * @returns returns array with operation and data
   */
  private prepare_self_vote(permlink: string): Array<any> {

    let selfUpvoteObject = {
      voter: this.username,
      author: this.username,
      permlink: permlink,
      weight: 10000 // 100% upvote
    };

    return [OPERATIONS.VOTE, selfUpvoteObject];
  }

  /**
   * Method to format permlink for a comment
   * @param parentAuthor 
   * @param parentPermlink 
   */
  private commentPermlink(parentAuthor, parentPermlink) {
    const timeStr = new Date().toISOString().replace(/[^a-zA-Z0-9]+/g, "").toLocaleLowerCase();
    parentPermlink = parentPermlink.replace(/(-\d{8}t\d{9}z)/g, "");
    return "re" + parentAuthor + "-" + parentPermlink + "-" + timeStr;
  }

}
