import birdeyeLogo from '../assets/birdeye-logo.svg'
import iconGoogle from '../assets/icon-google.svg'
import iconYelp from '../assets/icon-yelp.svg'

/** Maps a review source/channel name to its brand logo asset, for use in place of plain text. */
export const REVIEW_SOURCE_LOGOS: Record<string, string> = {
  Birdeye: birdeyeLogo,
  Google: iconGoogle,
  Yelp: iconYelp,
}
