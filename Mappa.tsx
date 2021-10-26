import { useLocationState } from '@xrengine/client-core/src/social/state/LocationState'
import { useAuthState } from '@xrengine/client-core/src/user/state/AuthState'
import { EngineEvents } from '@xrengine/engine/src/ecs/classes/EngineEvents'
import { InitializeOptions } from '@xrengine/engine/src/initializationOptions'
import { shutdownEngine } from '@xrengine/engine/src/initializeEngine'
import { PortalComponent } from '@xrengine/engine/src/scene/components/PortalComponent'
import React, { useEffect, useState } from 'react'
import {
  EngineCallbacks,
  initEngine,
  retriveLocationByName,
  teleportToLocation
} from '@xrengine/client/src/components/World/LocationLoadHelper'
import NetworkInstanceProvisioning from '@xrengine/client/src/components/World/NetworkInstanceProvisioning'
import Layout from '@xrengine/client/src/components/Layout/Layout'
import { useTranslation } from 'react-i18next'
import { ProjectReactProps } from '@xrengine/client/src/components/World/ProjectReactProps'
import { AuthService } from '@xrengine/client-core/src/user/state/AuthService'
import { useDispatch } from '@xrengine/client-core/src/store'
import UserProfile from './UserProfile'
import MapMediaIconsBox from './MapMediaIconsBox'
import MapUserMenu from './MapUserMenu'
import Button from '@material-ui/core/Button'
import Snackbar from '@material-ui/core/Snackbar'
import GameServerWarnings from '@xrengine/client/src/components/World/GameServerWarnings'

const goHome = () => (window.location.href = window.location.origin)

const engineRendererCanvasId = 'engine-renderer-canvas'

const defaultEngineInitializeOptions = {
  publicPath: location.origin,
  renderer: {
    canvasId: engineRendererCanvasId
  },
  physics: {
    simulationEnabled: false
  },
  systems: [
    {
      type: 'FIXED',
      systemModulePromise: import('@xrengine/client-core/src/systems/AvatarUISystem')
    },
    {
      type: 'FIXED',
      systemModulePromise: import('@xrengine/client-core/src/proximity/systems/ProximitySystem')
    },
    {
      type: 'FIXED',
      systemModulePromise: import('@xrengine/client-core/src/webcam/systems/WebCamInputSystem')
    }
  ]
}

const canvasStyle = {
  zIndex: 0,
  width: '100%',
  height: '100%',
  position: 'absolute',
  WebkitUserSelect: 'none',
  userSelect: 'none'
} as React.CSSProperties

const canvas = <canvas id={engineRendererCanvasId} style={canvasStyle} />

interface Props {
  locationName: string
  allowDebug?: boolean
  partyState?: any
  history?: any
  engineInitializeOptions?: InitializeOptions
  instanceConnectionState?: any
  showTouchpad?: boolean
  children?: any
  chatState?: any
  // todo: remove these props in favour of projects
  theme?: any
  hideVideo?: boolean
  hideFullscreen?: boolean
}

export const EnginePage = (props: Props) => {
  const { t } = useTranslation()
  const [isUserBanned, setUserBanned] = useState(true)
  const [isValidLocation, setIsValidLocation] = useState(true)
  const [isTeleporting, setIsTeleporting] = useState(false)
  const [newSpawnPos, setNewSpawnPos] = useState<ReturnType<typeof PortalComponent.get>>(null!)
  const authState = useAuthState()
  const engineInitializeOptions = Object.assign({}, defaultEngineInitializeOptions, props.engineInitializeOptions)
  const [sceneId, setSceneId] = useState('')
  const [loadingItemCount, setLoadingItemCount] = useState(99)
  const [harmonyOpen, setHarmonyOpen] = useState(false)
  const [projectComponents, setProjectComponents] = useState([] as any[])
  const locationState = useLocationState()

  const onSceneLoadProgress = (loadingItemCount: number): void => {
    setLoadingItemCount(loadingItemCount || 0)
  }

  const engineCallbacks: EngineCallbacks = {
    onSceneLoadProgress,
    onSceneLoaded: () => setLoadingItemCount(0)
  }

  /**
   * Log in & initialise flow...
   *
   * 1. Try to log in
   */
  useEffect(() => {
    addUIEvents()
    AuthService.doLoginAuto(true)
    return (): void => {
      shutdownEngine()
    }
  }, [])

  /**
   * 2. Once we have logged in, retrieve the location data
   */
  useEffect(() => {
    checkForBan()
    if (!isUserBanned && !locationState.fetchingCurrentLocation.value) {
      retriveLocationByName(authState, props.locationName, history)
    }
  }, [authState.isLoggedIn.value, authState.user.id.value])

  /**
   * 3. Once we have the location data, set the scene ID
   */
  useEffect(() => {
    if (sceneId === '' && locationState.currentLocation.location.sceneId.value) {
      setSceneId(locationState.currentLocation.location.sceneId.value)
    }
  }, [locationState.currentLocation.location.sceneId.value])

  /**
   * 4. Once we have the scene ID, initialise the engine
   */
  useEffect(() => {
    if (sceneId) {
      init()
    }
  }, [sceneId])

  const checkForBan = (): void => {
    const selfUser = authState.user
    const currentLocation = locationState.currentLocation.location

    const isUserBanned =
      selfUser?.locationBans?.value?.find((ban) => ban.locationId === currentLocation.id.value) != null
    setUserBanned(isUserBanned)
  }

  const init = async (): Promise<any> => {
    console.log('init', sceneId)
    setIsTeleporting(false)

    const componentFunctions = await initEngine(sceneId, engineInitializeOptions, newSpawnPos, engineCallbacks)

    const customProps: ProjectReactProps = {
      harmonyOpen,
      setHarmonyOpen
      // canvas
    }

    const components: any[] = []

    let key = 0
    componentFunctions.forEach((ComponentFunction) => {
      components.push(...components, <ComponentFunction {...customProps} key={key++} />)
    })

    setProjectComponents(components)
  }

  const portToLocation = async ({ portalComponent }: { portalComponent: ReturnType<typeof PortalComponent.get> }) => {
    const slugifiedName = locationState.currentLocation.location.slugifiedName.value

    teleportToLocation(portalComponent, slugifiedName, () => {
      setIsTeleporting(true)

      // change our browser URL
      props.history.replace('/location/' + portalComponent.location)
      setNewSpawnPos(portalComponent)
    })
  }

  const addUIEvents = () => {
    EngineEvents.instance.addEventListener(EngineEvents.EVENTS.PORTAL_REDIRECT_EVENT, portToLocation)
  }

  const [isUserProfileOpen, setShowUserProfile] = useState(true)

  const selfUser = authState.user

  if (isUserBanned) return <div className="banned">You have been banned from this location</div>

  // Do not add/remove the canvas element after engine init
  // It will break internal references and prevent XR session to work properly
  return (
    <>
      <NetworkInstanceProvisioning
        locationName={props.locationName}
        sceneId={sceneId}
        isUserBanned={isUserBanned}
        setIsValidLocation={setIsValidLocation}
        reinit={init}
      />
      {canvas}
      {projectComponents.length ? (
        projectComponents
      ) : (
        <Layout
          pageTitle={t('location.locationName.pageTitle')}
          harmonyOpen={harmonyOpen}
          setHarmonyOpen={setHarmonyOpen}
          theme={props.theme}
          hideVideo={props.hideVideo}
          hideFullscreen={props.hideFullscreen}
        >

      {!isValidLocation && (
        <Snackbar
          open
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
        >
          <>
            <section>Location is invalid</section>
            <Button onClick={goHome}>Return Home</Button>
          </>
        </Snackbar>
      )}
      <GameServerWarnings
        isTeleporting={isTeleporting}
        locationName={props.locationName}
        instanceId={selfUser?.instanceId.value}
      />
          <UserProfile isUserProfileShowing={isUserProfileOpen} showHideProfile={setShowUserProfile} />
          <MapMediaIconsBox />
          <MapUserMenu showHideProfile={setShowUserProfile} />
        </Layout>
      )}
    </>
  )
}

export default EnginePage
