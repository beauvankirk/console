import * as React from 'react'
import * as Immutable from 'immutable'
import * as Relay from 'react-relay'
import {withRouter, Link} from 'react-router'
import {connect} from 'react-redux'
import cuid from 'cuid'
import mapProps from '../../components/MapProps/MapProps'
import ScrollBox from '../../components/ScrollBox/ScrollBox'
import Tether from '../../components/Tether/Tether'
import AddModelMutation from '../../mutations/AddModelMutation'
import {sideNavSyncer} from '../../utils/sideNavSyncer'
import {onFailureShowNotification} from '../../utils/relay'
import {nextStep, showDonePopup} from '../../actions/gettingStarted'
import {showPopup} from '../../actions/popup'
import {Project, Viewer, Model} from '../../types/types'
import {ShowNotificationCallback} from '../../types/utils'
import {showNotification} from '../../actions/notification'
import {Popup} from '../../types/popup'
import {GettingStartedState} from '../../types/gettingStarted'
import EndpointPopup from './EndpointPopup'
import AddModelPopup from './AddModelPopup'
import styled from 'styled-components'
import * as cx from 'classnames'
import {$p, $v, Icon} from 'graphcool-styles'
import { ExcludeProps } from '../../utils/components'
import tracker from '../../utils/metrics'
import {ConsoleEvents} from 'graphcool-metrics'
import SideNavElement from './SideNavElement'

interface Props {
  params: any
  location: any
  project: Project
  projectCount: number
  viewer: Viewer
  relay: Relay.RelayProp
  models: Model[]
  gettingStartedState: GettingStartedState
  nextStep: () => Promise<any>
  skip: () => Promise<any>
  showNotification: ShowNotificationCallback
  router: ReactRouter.InjectedRouter
  showDonePopup: () => void
  showPopup: (popup: Popup) => void
  itemCount: number
  countChanges: Immutable.Map<string, number>
  isBetaCustomer: boolean
}

interface State {
  forceShowModels: boolean
  addingNewModel: boolean
  newModelName: string
  newModelIsValid: boolean
  modelsExpanded: boolean
}

// Section (Models, Relations, Permissions, etc.)

// Section Heads

const activeHead = `
  color: ${$v.white};

  svg {
    fill: ${$v.white};
    stroke: none !important;
  }

  &:hover {
    color: inherit;

    svg {
      fill: ${$v.white};
      stroke: none !important;
    }
  }

`

const Head = styled(ExcludeProps(Link, ['active']))`
  letter-spacing: 1px;
  line-height: 1;
  padding: 0 ${$v.size25};
  display: flex;
  align-items: center;
  text-transform: uppercase;
  font-weight: 600;
  color: ${$v.white60};
  transition: color ${$v.duration} linear;

  &:hover {
    color: ${$v.white80};

    svg {
      fill: ${$v.white80};
      stroke: none !important;
    }
  }

  > div {
    line-height: 1;
    margin-left: ${$v.size10};
  }

  svg {
    fill: ${$v.white60};
    stroke: none !important;
    transition: fill ${$v.duration} linear;
  }

  ${props => props.active && activeHead}
`

const footerSectionStyle = `
  display: flex;
  align-items: center;
  padding: ${$v.size25};
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 1px;
  color: ${$v.white60};
  cursor: pointer;
  transition: color ${$v.duration} linear;

  > div {
    margin-left: ${$v.size10};
  }

  svg {
    fill: ${$v.white60};
    transition: fill ${$v.duration} linear

  }

  &:hover {
    color: ${$v.white80};
    svg {
      fill: ${$v.white80};
    }
  }
`
const FooterSection = styled.div`${footerSectionStyle}`
const FooterLink = styled.a`${footerSectionStyle}`

export class SideNav extends React.PureComponent<Props, State> {

  shouldComponentUpdate: any

  constructor(props) {
    super(props)
    this.state = {
      forceShowModels: false,
      addingNewModel: false,
      newModelName: '',
      newModelIsValid: true,
      modelsExpanded: false,
    }
  }

  componentDidMount() {
    sideNavSyncer.setCallback(this.fetch, this)
  }

  componentWillUnmount() {
    sideNavSyncer.setCallback(null, null)
  }

  render() {
    const {isBetaCustomer, project} = this.props
    return (
      <div
        className={cx(
          $p.relative,
          $p.w100,
          $p.h100,
          $p.white,
          $p.bgDarkerBlue,
          $p.f14,
        )}
        onMouseLeave={() => this.setState({forceShowModels: false} as State)}
      >
        <style jsx>{`
          .links {
            @p: .flex, .flexColumn, .justifyBetween, .mt16;
            height: calc(100% - 16px);
          }
        `}</style>
        <div className={cx($p.h100)} style={{ paddingBottom: '70px' }}>
          <ScrollBox>
            <div className='links'>
              <div>
                <SideNavElement
                  link={`/${project.name}/schema`}
                  iconSrc={require('assets/icons/schema.svg')}
                  text='Schema'
                  size={24}
                  active={location.pathname.includes(`${this.props.params.projectName}/schema`)}
                />
                <Tether
                  steps={[{
                    step: 'STEP3_CLICK_DATA_BROWSER',
                    title: 'Switch to Data Browser',
                    description: 'In the Data Browser you can view and manage your data ("Post" nodes in our case).',
                  }]}
                  width={280}
                  offsetX={10}
                  offsetY={15}
                  zIndex={2000}
                  style={{
                    pointerEvents: 'none',
                  }}
                >
                  <SideNavElement
                    active={location.pathname.endsWith('databrowser')}
                    link={`/${this.props.params.projectName}/models/${this.props.models[0].name}/databrowser`}
                    iconSrc={require('assets/icons/databrowser.svg')}
                    text='Data'
                    size={16}
                    minimalHighlight
                    onClick={this.handleDatabrowserClick}
                  />
                </Tether>
                {location.pathname.endsWith('databrowser') && (
                  this.renderModels()
                )}
                <SideNavElement
                  link={`/${project.name}/permissions`}
                  iconSrc={require('graphcool-styles/icons/fill/permissions.svg')}
                  text='Permissions'
                  active={location.pathname.includes('/permissions')}
                />
                <SideNavElement
                  link={`/${project.name}/actions`}
                  iconSrc={require('graphcool-styles/icons/fill/actions.svg')}
                  text='Mutation Callbacks'
                  active={location.pathname.endsWith('/actions')}
                />
                <SideNavElement
                  link={`/${project.name}/integrations`}
                  iconSrc={require('graphcool-styles/icons/fill/integrations.svg')}
                  text='Integrations'
                  active={location.pathname.endsWith('/integrations')}
                />
              </div>
              {this.renderPlayground()}
            </div>
          </ScrollBox>
        </div>
        <div
          className={cx(
            $p.absolute,
            $p.w100,
            $p.bottom0,
            $p.flex,
            $p.itemsCenter,
            $p.justifyBetween,
            $p.bgDarkBlue,
            $p.white60,
          )}
          style={{ height: '70px' }}
        >
          <FooterSection onClick={this.showEndpointPopup}>
            <Icon width={20} height={20} src={require('graphcool-styles/icons/fill/endpoints.svg')}/>
            <div>Endpoints</div>
          </FooterSection>
          <FooterLink
            href='https://graph.cool/docs'
            target='_blank'
            onClick={() => {
              tracker.track(ConsoleEvents.Sidenav.docsOpened())
            }}
          >
            <Icon width={20} height={20} src={require('graphcool-styles/icons/fill/docs.svg')}/>
            <div>Docs</div>
          </FooterLink>
        </div>
      </div>
    )
  }

  private handleDatabrowserClick = () => {
    if (this.props.gettingStartedState.isCurrentStep('STEP3_CLICK_DATA_BROWSER')) {
      this.props.nextStep()
    }
  }

  private handlePostModelClick = () => {
    if (this.props.gettingStartedState.isCurrentStep('STEP3_CLICK_POST_MODEL')) {
      this.props.nextStep()
    }
  }

  private renderPlayground = () => {
    const playgroundPageActive = this.props.router.isActive(`/${this.props.params.projectName}/playground`)
    const showGettingStartedOnboardingPopup = () => {
      if (this.props.gettingStartedState.isCurrentStep('STEP4_CLICK_PLAYGROUND')) {
        this.props.nextStep()
      }
    }

    return (
      <div className='playground'>
        <style jsx>{`
          .playground {
            @p: .mt16;
          }
          .playground-button {
            @p: .br2, .darkBlue, .f14, .fw6, .inlineFlex, .ttu, .ml25, .mb25, .itemsCenter;
            letter-spacing: 0.53px;
            background-color: rgb(185,191,196);
            padding: 7px 10px 8px 10px;
          }
          .text {
            @p: .ml10;
          }
        `}</style>
        <Link
          to={`/${this.props.params.projectName}/playground`}
          onClick={showGettingStartedOnboardingPopup}
        >
          <div className='playground-button'>
            <Icon
              width={20}
              height={20}
              src={require('graphcool-styles/icons/fill/playground.svg')}
              color={$v.darkBlue}
            />
            <Tether
              side='top'
              steps={[{
                step: 'STEP4_CLICK_PLAYGROUND',
                title: 'Open the Playground',
                description: 'Now that we have defined our data model and added example data it\'s time to send some queries to our backend!', // tslint:disable-line
              }]}
              offsetY={-20}
              width={280}
            >
              <div className='text'>Playground</div>
            </Tether>
          </div>
        </Link>
      </div>
    )
  }

  private renderModels = () => {
    const modelActive = (model) => (
      this.props.router.isActive(`/${this.props.params.projectName}/models/${model.name}/schema`) ||
      this.props.router.isActive(`/${this.props.params.projectName}/models/${model.name}/databrowser`)
    )

    const turnedToggleMore = `
      i {
        transform: rotate(180deg) !important;
        svg {
          position: relative;
          top: 1px;
        }
      }
    `

    const ToggleMore = styled.div`
      height: ${$v.size60};
      background: linear-gradient(to bottom, ${$v.darkerBlue0} 0%, ${$v.darkerBlue} 80%);

      svg {
        stroke-width: 4px;
        fill: none;
      }

      ${props => props.turned && turnedToggleMore}
    `

    const activeListElement = `
      color: ${$v.white} !important;
      background: ${$v.white07};
      cursor: default;
      &:before {
        content: "";
        position: absolute;
        top: -1px;
        bottom: -1px;
        left: 0;
        width: ${$v.size06};
        background: ${$v.green};
        border-radius: 0 2px 2px 0;
      }
      &:hover {
        color: inherit;
      }
    `

    const ListElement = styled(ExcludeProps(Link, ['active']))`
      transition: color ${$v.duration} linear;
      height: 32px;

      &:hover {
         color: ${$v.white60};
      }

      ${props => props.active && activeListElement}
    `

    return (
      <div className={cx(
        $p.relative,
      )}>
        <div
          className={cx($p.overflowHidden)}
          style={{
            height: 'auto',
            transition: 'height .5s ease',
          }}
        >
          <div
            className={cx($p.flex, $p.flexColumn, $p.mt10, $p.mb16)}
          >
            {this.props.models && this.props.models.map((model) => (
              <ListElement
                key={model.name}
                to={`/${this.props.params.projectName}/models/${model.name}/databrowser`}
                active={modelActive(model)}
                className={cx(
                  $p.relative, $p.fw6, $p.white30, $p.ph25, $p.flex, $p.justifyBetween, $p.itemsCenter, $p.mb6,
                  {
                    [$p.bgWhite07]: modelActive(model),
                  },
                )}
                onClick={this.handlePostModelClick}
              >
                <div className={cx($p.pl6, $p.mra, $p.flex, $p.flexRow, $p.itemsCenter)}>
                  {model.name === 'Post' ? (
                    <Tether
                      steps={[{
                        step: 'STEP3_CLICK_POST_MODEL',
                        title: 'Select the "Post" Model',
                      description: 'In the Data Browser you can view and manage your data ("Post" nodes in our case).',
                      }]}
                      width={280}
                      offsetX={-5}
                      offsetY={1}
                      zIndex={2000}
                      style={{
                        pointerEvents: 'none',
                      }}
                    >
                      <div>{model.name}</div>
                    </Tether>
                  ) : (
                    <div>{model.name}</div>
                  )}
                  {model.isSystem && (
                    <div
                      className={cx($p.ph4, $p.br2, $p.bgWhite20, $p.darkerBlue, $p.ttu, $p.f12, $p.ml10)}
                    >System</div>
                  )}
                </div>
                <div>{model.itemCount + (this.props.countChanges.get(model.id) || 0)}</div>
              </ListElement>
            ))}
          </div>
        </div>
      </div>
    )
  }

  private toggleModels = () => {
    const { modelsExpanded } = this.state
    this.setState({modelsExpanded: !modelsExpanded} as State)
  }

  private fetch = () => {
    // the backend might cache the force fetch requests, resulting in potentially inconsistent responses
    this.props.relay.forceFetch()
  }

  private addModel = (modelName: string) => {
    const redirect = () => {
      this.props.router.push(`/${this.props.params.projectName}/models/${modelName}`)
      this.setState({
        addingNewModel: false,
        newModelIsValid: true,
      } as State)
    }

    if (modelName) {
      Relay.Store.commitUpdate(
        new AddModelMutation({
          modelName,
          projectId: this.props.project.id,
        }),
        {
          onSuccess: () => {
            tracker.track(ConsoleEvents.Schema.Model.created({modelName}))
            if (
              modelName === 'Post' &&
              this.props.gettingStartedState.isCurrentStep('STEP1_CREATE_POST_MODEL')
            ) {
              this.props.showDonePopup()
              this.props.nextStep().then(redirect)
            } else {
              redirect()
            }
          },
          onFailure: (transaction) => {
            onFailureShowNotification(transaction, this.props.showNotification)
          },
        },
      )
    }
  }

  private showEndpointPopup = () => {
    const id = cuid()
    this.props.showPopup({
      element: <EndpointPopup id={id} projectId={this.props.project.id} alias={this.props.project.alias} />,
      id,
    })
  }

  private showAddModelPopup = () => {
    const id = cuid()
    this.props.showPopup({
      element: <AddModelPopup id={id} saveModel={this.saveModel} />,
      id,
    })
  }

  private saveModel = (modelName: string) => {
    this.addModel(modelName)
  }
}

const ReduxContainer = connect(
  state => ({
    gettingStartedState: state.gettingStarted.gettingStartedState,
    itemCount: state.databrowser.data.itemCount,
    countChanges: state.databrowser.data.countChanges,
  }),
  {
    nextStep,
    showDonePopup,
    showNotification,
    showPopup,
  },
)(withRouter(SideNav))

const MappedSideNav = mapProps({
  params: (props) => props.params,
  project: (props) => props.project,
  relay: (props) => props.relay,
  models: (props) => props.project.models.edges
    .map((edge) => edge.node)
    .sort((a, b) => a.name.localeCompare(b.name)),
  isBetaCustomer: props =>
    props.viewer &&
    props.viewer.user &&
    props.viewer.user.crm &&
    props.viewer.user.crm.information &&
    props.viewer.user.crm.information.isBeta || false,
})(ReduxContainer)

export default Relay.createContainer(MappedSideNav, {
  fragments: {
    viewer: () => Relay.QL`
      fragment on Viewer {
        user {
          id
          crm {
            information {
              isBeta
            }
          }
        }
      }
    `,
    project: () => Relay.QL`
      fragment on Project {
        id
        name
        alias
        webhookUrl
        models(first: 100) {
          edges {
            node {
              id
              name
              itemCount
              isSystem
            }
          }
        }
      }
    `,
  },
})
