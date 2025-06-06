import {
  Box,
  Button,
  Checkbox,
  DialogActions,
  DialogContent,
  DialogContentText,
  TextField,
  Typography,
  styled,
  Tab,
  Tabs,
  DoneAllIcon,
  DoneIcon,
  RemoveDoneIcon,
  Modal,
  ModalBody,
  useTheme,
} from '@sistent/sistent';
import { Search } from '@mui/icons-material';
import { errorHandlerGenerator, successHandlerGenerator } from '../utils/helpers/common';
import { pingKubernetes } from '../utils/helpers/kubernetesHelpers';
import { getK8sConfigIdsFromK8sConfig } from '../utils/multi-ctx';
import { useEffect, useState } from 'react';
import { iconMedium, iconSmall } from '../css/icons.styles';
import { RoundedTriangleShape } from './shapes/RoundedTriangle';
import { notificationColors } from '../themes/app';
import RedOctagonSvg from './shapes/Octagon';
import PatternIcon from '../assets/icons/Pattern';
import { useNotification } from '../utils/hooks/useNotification';
import { EVENT_TYPES } from '../lib/event-types';
import { K8sEmptyState } from './EmptyState/K8sContextEmptyState';
import { ACTIONS } from '../utils/Enum';
import CAN from '@/utils/can';
import { keys } from '@/utils/permission_constants';
import { K8sContextConnectionChip } from './Header';
import { useFilterK8sContexts } from './hooks/useKubernetesHook';
import { TooltipWrappedConnectionChip } from './connections/ConnectionChip';
import { setK8sContexts, updateProgress } from '@/store/slices/mesheryUi';
import { useDispatch, useSelector } from 'react-redux';

const DialogSubtitle = styled(DialogContentText)({
  overflowWrap: 'anywhere',
  textAlign: 'center',
  padding: '5px',
});

const ActionButton = styled(Button, {
  shouldForwardProp: (prop) => !['isUndeploy', 'isDisabled'].includes(prop),
})(({ theme, isUndeploy, isDisabled }) => ({
  margin: theme.spacing(0.5),
  padding: theme.spacing(1),
  borderRadius: 5,
  minWidth: 100,
  ...(isUndeploy &&
    !isDisabled && {
      backgroundColor: '#B32700',
      '&:hover': {
        backgroundColor: '#8f1f00',
        boxShadow:
          '0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%)',
      },
    }),
  ...(!isUndeploy && {
    color: '#fff',
    '&:hover': {
      boxShadow:
        '0px 2px 4px -1px rgb(0 0 0 / 20%), 0px 4px 5px 0px rgb(0 0 0 / 14%), 0px 1px 10px 0px rgb(0 0 0 / 12%)',
    },
  }),
  ...(isDisabled && {
    '&.Mui-disabled': {
      cursor: 'not-allowed',
      pointerEvents: 'all !important',
    },
  }),
}));
export const DialogStyledActions = styled(DialogActions)({
  display: 'flex',
  justifyContent: 'space-evenly',
});

export const ContextsContainer = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
});

export const TabLabelWrapper = styled('span')(({ theme }) => ({
  [theme.breakpoints.up('sm')]: {
    fontSize: '1em',
  },
  [theme.breakpoints.between('xs', 'sm')]: {
    fontSize: '0.8em',
  },
  color: theme.palette.icon.default,
}));

export const TriangleContainer = styled('div')({
  position: 'relative',
  marginLeft: 2,
});

export const TriangleNumber = styled('div')({
  position: 'absolute',
  bottom: 12,
  left: '37%',
  color: '#fff',
  fontSize: '0.8rem',
});

export const OctagonContainer = styled('div')({
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 34,
  marginLeft: 2,
});

export const OctagonText = styled('div')({
  position: 'absolute',
  bottom: 9.5,
  color: '#fff',
  fontSize: '0.8rem',
});

function ConfirmationMsg(props) {
  const {
    open,
    handleClose,
    submit,
    title,
    validationBody,
    componentCount,
    tab,
    errors,
    dryRunComponent,
  } = props;

  const [tabVal, setTabVal] = useState(tab);
  const [disabled, setDisabled] = useState(true);
  const [context, setContexts] = useState([]);
  const { notify } = useNotification();
  const { selectedK8sContexts } = useSelector((state) => state.ui);
  const { k8sConfig: k8scontext } = useSelector((state) => state.ui);

  let isDisabled =
    typeof selectedK8sContexts.length === 'undefined' || selectedK8sContexts.length === 0;
  const dispatch = useDispatch();
  useEffect(() => {
    setTabVal(tab);
    setContexts(k8scontext);
  }, [open]);

  useEffect(() => {
    setDisabled(isDisabled);
  }, [selectedK8sContexts]);

  const handleTabValChange = (event, newVal) => {
    setTabVal(newVal);
  };

  const handleKubernetesClick = (ctxID) => {
    updateProgress({ showProgress: true });
    pingKubernetes(
      successHandlerGenerator(notify, 'Kubernetes pinged', () =>
        updateProgress({ showProgress: false }),
      ),
      errorHandlerGenerator(notify, 'Kubernetes not pinged', () =>
        updateProgress({ showProgress: false }),
      ),
      ctxID,
    );
  };

  const handleSubmit = () => {
    if (selectedK8sContexts.length === 0) {
      notify({
        message: 'Please select Kubernetes context(s) before proceeding with the operation',
        event_type: EVENT_TYPES.INFO,
      });
    }

    if (tabVal === 2) {
      submit.deploy();
    } else if (tabVal === 1) {
      submit.unDeploy();
    }
    handleClose();
  };

  const searchContexts = (search) => {
    if (search === '') {
      setContexts(k8scontext);
      return;
    }
    let matchedCtx = [];
    k8scontext.forEach((ctx) => {
      if (ctx.name.includes(search)) {
        matchedCtx.push(ctx);
      }
    });
    setContexts(matchedCtx);
  };

  const setContextViewer = (id) => {
    if (id === 'all') {
      if (selectedK8sContexts?.includes('all')) {
        dispatch(setK8sContexts({ selectedK8sContexts: [] }));
      } else {
        dispatch(setK8sContexts({ selectedK8sContexts: ['all'] }));
      }
      return;
    }

    if (selectedK8sContexts?.includes(id)) {
      const filteredContexts = selectedK8sContexts.filter((cid) => cid !== id);
      dispatch(setK8sContexts({ selectedK8sContexts: filteredContexts }));
    } else if (selectedK8sContexts[0] === 'all') {
      const allContextIds = getK8sConfigIdsFromK8sConfig(k8scontext);
      dispatch(setK8sContexts({ selectedK8sContexts: allContextIds.filter((cid) => cid !== id) }));
    } else {
      if (selectedK8sContexts.length === k8scontext.length - 1) {
        dispatch(setK8sContexts({ selectedK8sContexts: ['all'] }));
        return;
      }
      dispatch(setK8sContexts({ selectedK8sContexts: [...selectedK8sContexts, id] }));
    }
  };
  const theme = useTheme();
  return (
    <Modal
      open={open}
      aria-labelledby="alert-dialog-title"
      headerIcon={<PatternIcon style={{ ...iconMedium }} fill={'#FFFFFF'}></PatternIcon>}
      closeModal={handleClose}
      title={title ? title : 'Confirmation'}
      aria-describedby="alert-dialog-description"
    >
      <ModalBody>
        <Tabs
          value={validationBody ? tabVal : tabVal === 2 ? 1 : 0}
          variant="scrollable"
          scrollButtons="auto"
          indicatorColor="primary"
          textColor="primary"
          centered
        >
          {!!validationBody && (
            <Tab
              data-cy="validate-btn-modal"
              onClick={(event) => handleTabValChange(event, 0)}
              label={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <DoneIcon
                    style={{
                      margin: '2px',
                      paddingRight: '2px',
                      ...iconSmall,
                    }}
                    fill={theme.palette.icon.default}
                    fontSize="small"
                  />
                  <TabLabelWrapper>Validate</TabLabelWrapper>
                  {errors?.validationError > 0 && (
                    <TriangleContainer>
                      <RoundedTriangleShape
                        color={notificationColors.warning}
                      ></RoundedTriangleShape>
                      <TriangleNumber style={errors.validationError > 10 ? { left: '25%' } : {}}>
                        {errors.validationError}
                      </TriangleNumber>
                    </TriangleContainer>
                  )}
                </div>
              }
              disabled={!CAN(keys.VALIDATE_DESIGN.action, keys.VALIDATE_DESIGN.resource)}
            />
          )}
          <Tab
            disabled={
              !CAN(keys.UNDEPLOY_DESIGN.action, keys.UNDEPLOY_DESIGN.subject) ||
              (CAN(keys.UNDEPLOY_DESIGN.action, keys.UNDEPLOY_DESIGN.subject) && disabled)
            }
            data-cy="Undeploy-btn-modal"
            onClick={(event) => handleTabValChange(event, 1)}
            label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ margin: '2px', paddingRight: '2px' }}>
                  {' '}
                  <RemoveDoneIcon
                    style={iconSmall}
                    width="20"
                    height="20"
                    fill={theme.palette.icon.default}
                  />
                </div>{' '}
                <TabLabelWrapper>Undeploy</TabLabelWrapper>{' '}
              </div>
            }
          />
          <Tab
            disabled={
              !CAN(keys.DEPLOY_DESIGN.action, keys.DEPLOY_DESIGN.subject) ||
              (CAN(keys.DEPLOY_DESIGN.action, keys.DEPLOY_DESIGN.subject) && disabled)
            }
            data-cy="deploy-btn-modal"
            onClick={(event) => handleTabValChange(event, 2)}
            label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <DoneAllIcon
                  style={{ margin: '2px', paddingRight: '2px', ...iconSmall }}
                  fill={theme.palette.icon.default}
                  fontSize="small"
                />
                <TabLabelWrapper>Deploy</TabLabelWrapper>
                {errors?.deploymentError > 0 && (
                  <OctagonContainer>
                    <RedOctagonSvg fill={notificationColors.darkRed}></RedOctagonSvg>
                    <OctagonText>{errors.deploymentError}</OctagonText>
                  </OctagonContainer>
                )}
              </div>
            }
          />
        </Tabs>

        {(tabVal === ACTIONS.DEPLOY || tabVal === ACTIONS.UNDEPLOY) && (
          <>
            <DialogSubtitle id="alert-dialog-description">
              <div style={{ height: '100%' }}>{dryRunComponent && dryRunComponent}</div>
              <div>
                <Typography variant="subtitle1" style={{ marginBottom: '0.8rem' }}>
                  {' '}
                  {componentCount !== undefined ? (
                    <>
                      {' '}
                      {componentCount} component{componentCount > 1 ? 's' : ''}{' '}
                    </>
                  ) : (
                    ''
                  )}
                </Typography>
                {k8scontext.length > 0 ? (
                  <Typography variant="body1">
                    <TextField
                      id="search-ctx"
                      label="Search"
                      size="small"
                      variant="outlined"
                      onChange={(event) => searchContexts(event.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'rgba(102, 102, 102, 0.12)',
                        margin: '1px 1px 8px ',
                      }}
                      InputProps={{
                        endAdornment: <Search style={iconMedium} />,
                      }}
                      // margin="none"
                    />
                    {context.length > 0 ? (
                      <Box display={'table'}>
                        <Checkbox
                          checked={selectedK8sContexts?.includes('all')}
                          onChange={() => setContextViewer('all')}
                          color="primary"
                        />
                        <span style={{ fontWeight: 'bolder' }}>select all</span>
                      </Box>
                    ) : (
                      <Typography variant="subtitle1">No Context found</Typography>
                    )}

                    <ContextsContainer>
                      {context.map((ctx) => (
                        <div
                          key={ctx.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-wrap',
                            alignItems: 'center',
                          }}
                        >
                          <Checkbox
                            checked={
                              selectedK8sContexts?.includes(ctx.id) ||
                              (selectedK8sContexts?.length > 0 && selectedK8sContexts[0] === 'all')
                            }
                            onChange={() => setContextViewer(ctx.id)}
                            color="primary"
                          />
                          <TooltipWrappedConnectionChip
                            title={ctx.name}
                            handlePing={() => handleKubernetesClick(ctx.connection_id)}
                            iconSrc={'/static/img/kubernetes.svg'}
                          />
                        </div>
                      ))}
                    </ContextsContainer>
                  </Typography>
                ) : (
                  <K8sEmptyState />
                )}
              </div>
            </DialogSubtitle>
          </>
        )}
        {tabVal === ACTIONS.VERIFY && (
          <DialogContent>
            <DialogContentText>{validationBody}</DialogContentText>
          </DialogContent>
        )}

        <DialogStyledActions>
          {tabVal === ACTIONS.DEPLOY || tabVal === ACTIONS.UNDEPLOY ? (
            <>
              <ActionButton onClick={handleClose} variant="contained">
                <Typography variant="body2">CANCEL</Typography>
              </ActionButton>

              <ActionButton disabled variant="contained" color="primary" isDisabled={true}>
                <Typography variant="body2">
                  {tabVal === ACTIONS.UNDEPLOY ? 'UNDEPLOY LATER' : 'DEPLOY LATER'}
                </Typography>
              </ActionButton>

              <ActionButton
                onClick={handleSubmit}
                variant="contained"
                color="primary"
                isUndeploy={tabVal === ACTIONS.UNDEPLOY}
                isDisabled={isDisabled}
                disabled={disabled}
                data-cy="deploy-btn-confirm"
              >
                <Typography variant="body2">
                  {tabVal === ACTIONS.UNDEPLOY ? 'UNDEPLOY' : 'DEPLOY'}
                </Typography>
              </ActionButton>
            </>
          ) : (
            <ActionButton onClick={handleClose} variant="contained" color="primary">
              <Typography variant="body2">OK</Typography>
            </ActionButton>
          )}
        </DialogStyledActions>
      </ModalBody>
    </Modal>
  );
}

export default ConfirmationMsg;

export const SelectDeploymentTarget_ = ({ k8scontext, selectedK8sContexts }) => {
  const dispatch = useDispatch();
  const deployableK8scontexts = useFilterK8sContexts(k8scontext, ({ operatorState }) => {
    return operatorState !== 'DISABLED';
  });
  const [searchedContexts, setSearchedContexts] = useState(deployableK8scontexts);
  const selectedContexts = selectedK8sContexts;

  const searchContexts = (search) => {
    if (search === '') {
      setSearchedContexts(k8scontext);
      return;
    }
    let matchedCtx = [];
    k8scontext.forEach((ctx) => {
      if (ctx.name.includes(search)) {
        matchedCtx.push(ctx);
      }
    });
    setSearchedContexts(matchedCtx);
  };

  const setContextViewer = (id) => {
    if (id === 'all') {
      if (selectedContexts?.includes('all')) {
        dispatch(setK8sContexts({ selectedK8sContexts: [] }));
      } else {
        dispatch(setK8sContexts({ selectedK8sContexts: ['all'] }));
      }
      return;
    }

    if (selectedContexts?.includes(id)) {
      const filteredContexts = selectedContexts.filter((cid) => cid !== id);
      dispatch(setK8sContexts({ selectedK8sContexts: filteredContexts }));
    } else if (selectedContexts[0] === 'all') {
      const allContextIds = getK8sConfigIdsFromK8sConfig(k8scontext);
      dispatch(setK8sContexts({ selectedK8sContexts: allContextIds.filter((cid) => cid !== id) }));
    } else {
      if (selectedContexts.length === k8scontext.length - 1) {
        dispatch(setK8sContexts({ selectedK8sContexts: ['all'] }));
        return;
      }
      dispatch(setK8sContexts({ selectedK8sContexts: [...selectedContexts, id] }));
    }
  };

  return k8scontext.length > 0 ? (
    <Typography variant="body1">
      <TextField
        id="search-ctx"
        label="Search"
        size="small"
        variant="outlined"
        onChange={(event) => searchContexts(event.target.value)}
        style={{
          width: '100%',
          backgroundColor: 'rgba(102, 102, 102, 0.12)',
          margin: '1px 1px 8px ',
        }}
        InputProps={{
          endAdornment: <Search style={iconMedium} />,
        }}
        // margin="none"
      />
      {searchedContexts.length > 0 ? (
        <Box display={'table'}>
          <Checkbox
            checked={selectedContexts?.includes('all')}
            onChange={() => setContextViewer('all')}
            color="primary"
          />
          <span style={{ fontWeight: 'bolder' }}>select all</span>
        </Box>
      ) : (
        <K8sEmptyState message={'No active cluster found'} />
      )}

      <ContextsContainer>
        {deployableK8scontexts.map((ctx) => (
          <K8sContextConnectionChip
            ctx={ctx}
            key={ctx.id}
            selectable
            selected={
              selectedContexts.includes(ctx.id) ||
              (selectedContexts?.length > 0 && selectedContexts[0] === 'all')
            }
            onSelectChange={() => setContextViewer(ctx.id)}
          />
        ))}
      </ContextsContainer>
    </Typography>
  ) : (
    <K8sEmptyState message={'No active cluster found'} />
  );
};

export const SelectDeploymentTarget = SelectDeploymentTarget_;
