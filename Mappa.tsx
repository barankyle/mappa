import React, { useEffect, useState } from 'react'
import MapMediaIconsBox from './MapMediaIconsBox'
import MapUserMenu from './MapUserMenu'
import { theme } from './theme'
import { AvatarInputSchema } from '@xrengine/engine/src/avatar/AvatarInputSchema'
import { TouchInputs } from '@xrengine/engine/src/input/enums/InputEnums'
import { BaseInput } from '@xrengine/engine/src/input/enums/BaseInput'
import UserProfile from './UserProfile'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'

const MappaClientLayout = (props) => {
  const [isUserProfileOpen, setShowUserProfile] = useState(true)

  useEffect(() => {
    EngineEvents.instance.once(EngineEvents.EVENTS.INITIALIZED_ENGINE, () => {
      AvatarInputSchema.inputMap.set(TouchInputs.Touch, BaseInput.PRIMARY)
    })
  }, [])

  // TODO: figure out how to inject 'theme'


  return (
    <>
      <UserProfile isUserProfileShowing={isUserProfileOpen} showHideProfile={setShowUserProfile} />
      <MapMediaIconsBox />
      <MapUserMenu showHideProfile={setShowUserProfile} />
    </>
  )
}

export default MappaClientLayout
