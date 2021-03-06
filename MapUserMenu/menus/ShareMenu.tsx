import React, { useRef } from 'react'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import { Send, FileCopy } from '@mui/icons-material'
import { isShareAvailable } from '@xrengine/engine/src/common/functions/DetectFeatures'
import styles from '../MapUserMenu.module.scss'
import { InviteService } from '@xrengine/client-core/src/social/state/InviteService'
import { useTranslation } from 'react-i18next'
import { useInviteState } from '@xrengine/client-core/src/social/state/InviteState'

interface Props {
  alertSuccess?: any
}

const ShareMenu = (props: Props): any => {
  const { t } = useTranslation()
  const [email, setEmail] = React.useState('')
  const refLink = useRef(null)
  const postTitle = 'AR/VR world'
  const siteTitle = 'XREngine'
  const inviteState = useInviteState()

  const copyLinkToClipboard = () => {
    refLink.current.select()
    document.execCommand('copy')
    refLink.current.setSelectionRange(0, 0) // deselect
    props.alertSuccess(t('user:usermenu.share.linkCopied'))
  }

  const shareOnApps = () => {
    navigator
      .share({
        title: `${postTitle} | ${siteTitle}`,
        text: `Check out ${postTitle} on ${siteTitle}`,
        url: document.location.href
      })
      .then(() => {
        console.log('Successfully shared')
      })
      .catch((error) => {
        console.error('Something went wrong sharing the world', error)
      })
  }

  const packageInvite = async (): Promise<void> => {
    const sendData = {
      type: 'friend',
      token: email,
      inviteCode: null,
      identityProviderType: 'email',
      targetObjectId: inviteState.targetObjectId.value,
      invitee: null
    }
    InviteService.sendInvite(sendData)
    setEmail('')
  }

  const handleChang = (e) => {
    setEmail(e.target.value)
  }

  return (
    <div className={styles.menuPanel}>
      <div className={styles.sharePanel}>
        <Typography variant="h1" className={styles.panelHeader}>
          {t('user:usermenu.share.title')}
        </Typography>
        <textarea readOnly className={styles.shareLink} ref={refLink} value={window.location.href} />
        <Button onClick={copyLinkToClipboard} className={styles.copyBtn}>
          {t('user:usermenu.share.lbl-copy')}
          <span className={styles.materialIconBlock}>
            <FileCopy />
          </span>
        </Button>

        <Typography variant="h5">{t('user:usermenu.share.lbl-phoneEmail')}</Typography>
        <TextField
          className={styles.emailField}
          size="small"
          placeholder={t('user:usermenu.share.ph-phoneEmail')}
          variant="outlined"
          value={email}
          onChange={(e) => handleChang(e)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" onClick={() => packageInvite()}>
                <Send />
              </InputAdornment>
            )
          }}
        />
        {isShareAvailable ? (
          <div className={styles.shareBtnContainer}>
            <Button className={styles.shareBtn} onClick={shareOnApps}>
              {t('user:usermenu.share.lbl-share')}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ShareMenu
