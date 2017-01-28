import * as React from 'react'
import * as Relay from 'react-relay'
import {Project} from '../../../types/types'
import Icon from 'graphcool-styles/dist/components/Icon/Icon'
import {$p, $v} from 'graphcool-styles'
import UpdateProjectMutation from '../../../mutations/UpdateProjectMutation'
import {ShowNotificationCallback} from '../../../types/utils'
import {onFailureShowNotification} from '../../../utils/relay'
import {connect} from 'react-redux'
import {showNotification} from '../../../actions/notification'
import {bindActionCreators} from 'redux'
import CopyToClipboard from 'react-copy-to-clipboard'
import * as cx from 'classnames'

interface Props {
  project: Project
  showNotification: ShowNotificationCallback
}

interface State {
  isEnteringProjectName: boolean
  newProjectName: string
  isHoveringProjectName: boolean
  projectIdCopied: boolean
}

class ProjectInfo extends React.Component<Props, State> {

  copyTimer: number

  constructor(props) {
    super(props)

    this.state = {
      isEnteringProjectName: false,
      newProjectName: props.project.name,
      isHoveringProjectName: false,
      projectIdCopied: false,
    }

  }

  render() {
    return (

      <div className='flex flexColumn pt38 pl60'>
        <style jsx={true}>{`

          .inputField {
            @inherit: .f25, .fw3, .w100, .pt6;
            max-width: 300px;
            color: rgba(42,127,211,1);
          }

          .saveButton {
            @inherit: .ph10, .pv6, .fw6, .ttu, .f14, .buttonShadow, .pointer;
            color: rgba(42,127,211,1);
          }

          .resetButton {
            @inherit: .underline, .pl6, .f14, .fw6, .pointer;
            color: rgba(241,143,1,1);
          }

          @keyframes movingCopyIndicator {
            0% {
              opacity: 0;
              transform: translate(-50%, 0);
            }

            50% {
              opacity: 1;
            }

            100% {
              opacity: 0;
              transform: translate(-50%, -50px);
            }
          }

          .copyIndicator {
            top: -30px;
            left: 50%;
            transform: translate(-50%,0);
            animation: movingCopyIndicator .7s linear;
          }

        `}</style>

        {this.state.isEnteringProjectName ?
          (
            <div className='flex flexColumn pl16 pt16 pb25'>
              <div className='flex itemsCenter'>
                <div className='black o40 f14'>Project Name</div>
                <div
                  className='resetButton'
                  onClick={() => this.setState({isEnteringProjectName: false} as State)}
                >
                  Reset
                </div>
              </div>
              <div className='flex itemsCenter'>
                <input
                  autoFocus={true}
                  className='inputField'
                  value={this.state.newProjectName}
                  onKeyDown={this.handleKeyDown}
                  onChange={(e: any) => this.setState({newProjectName: e.target.value} as State)}
                />
                <div
                  className='saveButton'
                  onClick={this.saveSettings}
                >
                  Save
                </div>
              </div>
            </div>
          )
          :
          (
            <div className='flex flexColumn pl16 pt16 pb25'>
              <div className='black o40 f14'>Project Name</div>
              <div
                className='flex itemsCenter pointer'
                onMouseEnter={() => this.setState({isHoveringProjectName: true} as State)}
                onMouseLeave={() => this.setState({isHoveringProjectName: false} as State)}
                onClick={() => this.setState({
                    isEnteringProjectName: true,
                    isHoveringProjectName: false,
                  } as State)}
              >
                <div
                  className='fw3 f25 pt6'
                >
                  {this.props.project.name}
                </div>
                {this.state.isHoveringProjectName && (<Icon
                  className={$p.ml6}
                  src={require('../../../assets/icons/edit_project_name.svg')}
                  width={20}
                  height={20}
                />)}
              </div>
            </div>

          )
        }
        <div className='flex flexColumn pl16 pt16 pb25'>
          <div className='flex itemsCenter'>
            <Icon
              className={$p.mr6}
              src={require('../../../assets/icons/lock.svg')}
              width={14}
              height={20}
            />
            <div className='black o40 f14'>Project ID</div>
          </div>
          <div className='flex itemsCenter'>
            <div className='fw3 f25 pt6'>{this.props.project.id}</div>
            <CopyToClipboard
              text={this.props.project.id}
              onCopy={this.onCopy}
            >
              <div
                className='relative bgWhite selfCenter br2 pointer'
              >
                {this.state.projectIdCopied && (
                  <div
                    className='copyIndicator absolute f14 fw6 blue'
                  >
                    Copied
                  </div>
                )}
                <Icon
                  className='ml10 pointer buttonShadow'
                  color={'rgba(0,0,0,.5)'}
                  src={require('../../../assets/icons/copy.svg')}
                  width={34}
                  height={34}
                />
              </div>
            </CopyToClipboard>
          </div>
        </div>
      </div>
    )
  }

  private saveSettings = (): void => {
    Relay.Store.commitUpdate(
      new UpdateProjectMutation(
        {
          project: this.props.project,
          name: this.state.newProjectName,
        }),
      {
        onSuccess: () => {
          // this.props.router.replace(`/${this.state.projectName}/`)
        },
        onFailure: (transaction) => {
          onFailureShowNotification(transaction, this.props.showNotification)
        },
      })
  }

  private handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      this.saveSettings()
    } else if (e.keyCode === 27) {
      this.setState({
        isEnteringProjectName: false,
      } as State)
    }
  }

  private onCopy: () => any = () => {
    this.setState({projectIdCopied: true} as State)
    this.copyTimer = window.setTimeout(
      () => this.setState({projectIdCopied: false} as State),
      1000,
    )
  }

}

const mapDispatchToProps = (dispatch) => {
  return bindActionCreators({showNotification}, dispatch)
}

const mappedProjectInfo = connect(null, mapDispatchToProps)(ProjectInfo)

export default Relay.createContainer(mappedProjectInfo, {
  fragments: {
    project: () => Relay.QL`
      fragment on Project {
        id
        name
      }
    `,
  },
})

