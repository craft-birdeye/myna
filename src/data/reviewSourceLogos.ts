import birdeyeLogo from '../assets/birdeye-logo.svg'
import iconDirectFeedback from '../assets/icon-direct-feedback.svg'
import iconFacebook from '../assets/icon-facebook.svg'
import iconGoogle from '../assets/icon-google.svg'
import iconGooglePlay from '../assets/icon-google-play.svg'
import iconYelp from '../assets/icon-yelp.svg'

/** Maps a review source/channel name to its brand logo asset, for use in place of plain text. */
export const REVIEW_SOURCE_LOGOS: Record<string, string> = {
  Birdeye: birdeyeLogo,
  'Direct Feedback': iconDirectFeedback,
  Facebook: iconFacebook,
  Google: iconGoogle,
  'Google Play': iconGooglePlay,
  Yelp: iconYelp,
}
