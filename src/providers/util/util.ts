import { Injectable } from '@angular/core';
import { NavController } from 'ionic-angular';
import { IMG_SERVER, NO_IMAGE_COMMENT, NO_IMAGE_POST } from '../../constants/constants';

/**
 * Utility Class
 * @author Jayser Mendez
 * @version 0.0.1
 * @class UtilProvider
 */

@Injectable()
export class UtilProvider {
  
  constructor() {}

  /**
   * Method to replace broken images with placeholder
   * @param type 
   * @param event 
   */
  public imgError(type: string, event): void {
    if (type === 'comment') {
      event.target.src = NO_IMAGE_COMMENT;
    }

    else if (type === 'post') {
      event.target.src = NO_IMAGE_POST;
    }
    
  }

  /**
   * Method to render the image in the correct size
   * @param type 
   * @param img 
   */
  public renderImage(type: string, img: string): string {
    if (type === 'profile') {
      return IMG_SERVER + '80x80/' + img;
    }

    else if (type === 'cover') {
      return IMG_SERVER + '850x500/' + img;
    }

    else if (type === 'votes') {
      return IMG_SERVER + '50x50/' + img
    }
  }

  /**
   * Method to add pluralization to the likes in the post
   * @param likes 
   */
  public renderLikes(likes: number): string {
    if (likes > 1 || likes == 0) return likes.toLocaleString() + ' likes';
    else return likes + ' like';
  }

  /**
   * @method encodeQueryData: add parameters to an url
   * @param {Object} parameters: parameters to add to url
   * @returns url with the parameters added
   */
  public encodeQueryData(parameters: any) {
    let ret = [];
    for (let d in parameters)
      ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(parameters[d]));
    return ret.join('&');
  }

}
