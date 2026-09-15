import iconGoogle from '../../assets/icon-google.svg'
import iconFacebook from '../../assets/icon-facebook.svg'
import iconWhatsapp from '../../assets/icon-whatsapp.svg'
import iconInstagram from '../../assets/icon-instagram.svg'
import iconLinkedin from '../../assets/icon-linkedin.svg'
import iconTwitter from '../../assets/icon-twitter.svg'
import iconYoutube from '../../assets/icon-youtube.svg'
import iconTeams from '../../assets/icon-teams.svg'
import iconOutlook from '../../assets/icon-outlook.svg'
import iconYelp from '../../assets/icon-yelp.svg'
import birdeyeLogo from '../../assets/birdeye-logo.svg'

/** Maps a Connections card's `logoSrc` key to its real brand asset — reused from the
 *  same assets other real myna screens use for these brands (see reviewSourceLogos.ts)
 *  instead of a generic Material icon standing in for a known logo. */
export const SUPER_AGENT_CONNECTION_LOGOS: Record<string, string> = {
  google: iconGoogle,
  facebook: iconFacebook,
  whatsapp: iconWhatsapp,
  instagram: iconInstagram,
  linkedin: iconLinkedin,
  twitter: iconTwitter,
  youtube: iconYoutube,
  teams: iconTeams,
  outlook: iconOutlook,
  yelp: iconYelp,
  birdeye: birdeyeLogo,
}
