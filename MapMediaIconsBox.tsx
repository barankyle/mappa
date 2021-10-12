import { useAuthState } from '@xrengine/client-core/src/user/reducers/auth/AuthState'
import { Network } from '@xrengine/engine/src/networking/classes/Network'
import { MediaStreams } from '@xrengine/engine/src/networking/systems/MediaStreamSystem'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import {MediaStreamService} from '@xrengine/client/src/reducers/mediastream/MediaStreamService'
import {
  configureMediaTransports,
  createCamAudioProducer,
  endVideoChat,
  leave,
  pauseProducer,
  resumeProducer
} from '@xrengine/client/src/transports/SocketWebRTCClientFunctions'
import { MicOff } from './icons/MicOff'
import { MicOn } from './icons/MicOn'
import styles from './MapMediaIconsBox.module.scss'
import { useLocationState } from '@xrengine/client-core/src/social/reducers/location/LocationState'

const mapStateToProps = (state: any): any => {
  return {
    mediastream: state.get('mediastream')
  }
}

const mapDispatchToProps = (dispatch): any => ({})

const MediaIconsBox = (props) => {
  const { mediastream } = props
  const [hasAudioDevice, setHasAudioDevice] = useState(false)

  const user = useAuthState().user
  const locationState = useLocationState()
  const currentLocation = locationState.currentLocation.value

  const instanceMediaChatEnabled = currentLocation.location.location_settings
    ? currentLocation.location.location_settings.instanceMediaChatEnabled
    : false

  const isCamAudioEnabled = mediastream.isCamAudioEnabled

  useEffect(() => {
    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        devices.forEach((device) => {
          if (device.kind === 'audioinput') setHasAudioDevice(true)
        })
      })
      .catch((err) => console.log('could not get media devices', err))
  }, [])

  const onEngineLoaded = () => {
    document.removeEventListener('ENGINE_LOADED', onEngineLoaded)
  }
  document.addEventListener('ENGINE_LOADED', onEngineLoaded)

  const checkEndVideoChat = async () => {
    if (
      (MediaStreams.instance.audioPaused || MediaStreams.instance?.camAudioProducer == null) &&
      (MediaStreams.instance.videoPaused || MediaStreams.instance?.camVideoProducer == null)
    ) {
      await endVideoChat({})
      if ((Network.instance.transport as any).channelSocket?.connected === true) await leave(false)
    }
  }
  const handleMicClick = async () => {
    const partyId =
      currentLocation?.location.location_settings?.instanceMediaChatEnabled === true ? 'instance' : user.partyId.value
    if (await configureMediaTransports(['audio'], partyId)) {
      if (MediaStreams.instance?.camAudioProducer == null) await createCamAudioProducer(partyId)
      else {
        const audioPaused = MediaStreams.instance.toggleAudioPaused()
        if (audioPaused === true) await pauseProducer(MediaStreams.instance?.camAudioProducer)
        else await resumeProducer(MediaStreams.instance?.camAudioProducer)
        checkEndVideoChat()
      }
      MediaStreamService.updateCamAudioState()
    }
    console.log('Mic Clicked=>' + isCamAudioEnabled)
  }

  const MicIcon = isCamAudioEnabled ? '/static/Microphone-on.png' : '/static/Microphone.png'

  return (
    <section className={styles.drawerBox}>
      {instanceMediaChatEnabled && hasAudioDevice ? (
        <button
          type="button"
          id="UserAudio"
          className={styles.iconContainer + ' ' + (isCamAudioEnabled ? styles.on : '')}
          onClick={handleMicClick}
        >
          <img src={MicIcon} />
        </button>
      ) : null}
    </section>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(MediaIconsBox)
