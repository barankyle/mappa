import Avatar from '@material-ui/core/Avatar'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'
import ListItem from '@material-ui/core/ListItem'
import ListItemAvatar from '@material-ui/core/ListItemAvatar'
import ListItemText from '@material-ui/core/ListItemText'
import TextField from '@material-ui/core/TextField'
import { useAuthState } from '@xrengine/client-core/src/user/reducers/auth/AuthState'
import { User } from '@xrengine/common/src/interfaces/User'
import classNames from 'classnames'
import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators, Dispatch } from 'redux'
import { accessInstanceConnectionState } from '@xrengine/client/src/reducers/instanceConnection/InstanceConnectionState'
import styles from './MapInstanceChat.module.scss'
import { AlertActionType } from '@xrengine/client-core/src/common/reducers/alert/AlertActions'
import { ChatService } from '@xrengine/client-core/src/social/reducers/chat/ChatService'

const mapStateToProps = (state: any): any => {
  return {
    instanceConnectionState: accessInstanceConnectionState().value
  }
}

const mapDispatchToProps = (dispatch: Dispatch): any => ({})

interface Props {
  chatState?: any
  instanceConnectionState?: any
  newMessageLabel?: string
  isOpen: boolean
  setUnreadMessages: (hasUnreadMessages: boolean) => void
}

const InstanceChat = (props: Props): any => {
  const {
    chatState,
    instanceConnectionState,
    newMessageLabel = 'Say something...',
    isOpen,
    setUnreadMessages
  } = props

  let activeChannel
  const messageRef = React.useRef<HTMLInputElement>()
  const user = useAuthState().user
  const channelState = chatState.get('channels')
  const channels = channelState.get('channels')
  const [composingMessage, setComposingMessage] = useState('')
  const activeChannelMatch = [...channels].find(([, channel]) => channel.channelType === 'instance')
  if (activeChannelMatch && activeChannelMatch.length > 0) {
    activeChannel = activeChannelMatch[1]
  }

  useEffect(() => {
    if (instanceConnectionState.get('connected') === true && channelState.get('fetchingInstanceChannel') !== true) {
      ChatService.getInstanceChannel()
    }
  }, [instanceConnectionState])

  const handleComposingMessageChange = (event: any): void => {
    const message = event.target.value
    setComposingMessage(message)
  }

  const packageMessage = (): void => {
    if (composingMessage.length > 0) {
      ChatService.createMessage({
        targetObjectId: user.instanceId.value,
        targetObjectType: 'instance',
        text: composingMessage
      })
      setComposingMessage('')
    }
  }

  const [isMultiline, setIsMultiline] = React.useState(false)
  const [cursorPosition, setCursorPosition] = React.useState(0)
  const [dimensions, setDimensions] = useState({
    height: window.innerHeight,
    width: window.innerWidth
  })

  const getMessageUser = (message): string => {
    return message.sender?.name + ': '
  }

  useEffect(() => {
    activeChannel && activeChannel.messages && activeChannel.messages.length > 0 && !isOpen && setUnreadMessages(true)
  }, [activeChannel?.messages])

  useEffect(() => {
    if (isMultiline) {
      ;(messageRef.current as HTMLInputElement).selectionStart = cursorPosition + 1
    }
  }, [isMultiline])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [])

  const handleWindowResize = () => {
    setDimensions({
      height: window.innerHeight,
      width: window.innerWidth
    })
  }

  const getAvatar = (message): any => {
    return (
      dimensions.width > 768 && (
        <ListItemAvatar className={styles['message-sender-avatar']}>
          <Avatar src={message.sender?.avatarUrl} />
        </ListItemAvatar>
      )
    )
  }

  return (
    <>
      <div className={styles['instance-chat-container'] + ' ' + (!isOpen && styles['messageContainerClosed'])}>
        <div className={styles['list-container']}>
          <Card square={true} elevation={0} className={styles['message-wrapper']}>
            <CardContent className={styles['message-container']}>
              {activeChannel != null &&
                activeChannel.messages &&
                activeChannel.messages
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .slice(
                    activeChannel.messages.length >= 3 ? activeChannel.messages?.length - 3 : 0,
                    activeChannel.messages?.length
                  )
                  .map((message) => {
                    if (message.senderId === user.id.value) {
                      return (
                        <ListItem
                          className={classNames({ [styles.message]: true, [styles.self]: true })}
                          disableGutters={true}
                          key={message.id}
                        >
                          <div className={styles['message-self']}>
                            <ListItemText
                              className={styles['message-self-text']}
                              primary={
                                <span>
                                  <span className={styles.message}>{message.text}</span>
                                </span>
                              }
                            />
                            {getAvatar(message)}
                          </div>
                        </ListItem>
                      )
                    } else {
                      return (
                        <ListItem
                          className={classNames({ [styles.message]: true, [styles.other]: true })}
                          disableGutters={true}
                          key={message.id}
                        >
                          <div className={styles['message-other']}>
                            {getAvatar(message)}
                            <ListItemText
                              className={styles['message-other-text']}
                              primary={
                                <span>
                                  <span className={styles.userName}>{getMessageUser(message)}</span>
                                  <span className={styles.message}>{message.text}</span>
                                </span>
                              }
                            />
                          </div>
                        </ListItem>
                      )
                    }
                  })}
            </CardContent>
          </Card>
          <Card className={styles['chat-view']} style={{ boxShadow: 'none' }}>
            <CardContent className={styles['chat-box']} style={{ boxShadow: 'none' }}>
              <TextField
                className={styles.messageFieldContainer}
                margin="normal"
                multiline={isMultiline}
                fullWidth
                id="newMessage"
                label={newMessageLabel}
                name="newMessage"
                autoFocus
                autoComplete="off"
                value={composingMessage}
                inputProps={{
                  maxLength: 1000,
                  'aria-label': 'naked'
                }}
                InputLabelProps={{ shrink: false }}
                onChange={handleComposingMessageChange}
                inputRef={messageRef}
                onClick={() => (messageRef as any)?.current?.focus()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault()
                    const selectionStart = (e.target as HTMLInputElement).selectionStart
                    setCursorPosition(selectionStart)
                    setComposingMessage(
                      composingMessage.substring(0, selectionStart) + '\n' + composingMessage.substring(selectionStart)
                    )
                    !isMultiline && setIsMultiline(true)
                  } else if (e.key === 'Enter' && !e.ctrlKey) {
                    e.preventDefault()
                    packageMessage()
                    isMultiline && setIsMultiline(false)
                    setCursorPosition(0)
                  }
                }}
              />
              <button className={styles.sendButton} onClick={packageMessage}>
                <img src="/static/Send.png" />
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(InstanceChat)
