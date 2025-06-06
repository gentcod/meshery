import { ErrorTypes } from '@/constants/common';
import {
  ErrorSection,
  ErrorSectionContainer,
  ErrorContainer,
  ErrorContentContainer,
  ErrorMain,
  ErrorSectionContent,
  StyledButton,
  ImageContainer,
  IconWrapper,
  Logo,
  LogoText,
  StyledDivider,
  ErrorLink,
} from './styles';
import { Typography, InfoCircleIcon, CustomTooltip, useTheme } from '@sistent/sistent';
import OrgSwitcher from './OrgSwitcher';
// import RequestForm from './RequestForm';
import CurrentSessionInfo from './CurrentSession';

//TODO: Add component for meshery version compatiblity error
// const MesheryVersionCompatiblity = () => {
//   return (
//     <div>
//       <Typography variant="p" component="p" align="center">
//         <InstallMeshery action={MesheryAction.UPGRADE.KEY} />
//       </Typography>
//     </div>
//   );
// };

const UnknownServerSideError = (props) => {
  const { errorContent } = props;
  return (
    <div>
      <ErrorContentContainer>
        <Typography variant="p" component="p" align="center">
          {errorContent}
        </Typography>
      </ErrorContentContainer>
    </div>
  );
};

const DefaultError = (props) => {
  const { errorTitle, errorContent, errorType } = props;
  const theme = useTheme();

  return (
    <ErrorMain>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <ImageContainer>
          <Logo src="/static/img/meshery-logo/meshery-logo.svg" alt="Meshery logo" />
          <LogoText
            src={
              theme.palette.mode === 'dark'
                ? '/static/img/meshery-logo/meshery-white.svg'
                : '/static/img/meshery-logo/meshery-black.svg'
            }
            alt="Meshery logo text"
          />
        </ImageContainer>
        <Typography
          variant="h4"
          component="h4"
          align="center"
          className="errormsg"
          style={{ color: theme.palette.text.default }}
        >
          {errorTitle
            ? errorTitle
            : "Oops! It seems like you don't have the necessary permissions to view this page."}
        </Typography>
        {errorType === ErrorTypes.UNKNOWN ? (
          <UnknownServerSideError errorContent={errorContent} />
        ) : null}
      </div>

      <ErrorContainer>
        <ErrorSectionContainer>
          <ErrorSection>
            <Typography variant="h5" component="h5" align="center" fontWeight={600}>
              YOUR CURRENT SESSION
            </Typography>
            <CurrentSessionInfo />
          </ErrorSection>
          <StyledDivider orientation="vertical" flexItem />
          <ErrorSection>
            <Typography variant="h5" component="h5" align="center" fontWeight={600}>
              YOUR OPTIONS
            </Typography>
            {/* this is left intentionally inline for now since this is a one off till we implement
               the request form*/}
            <ErrorSectionContent
              style={{
                flex: '1',
                justifyContent: 'center',
              }}
            >
              <OrgSwitcher />
              {/*<Divider />
                <RequestForm />*/}
            </ErrorSectionContent>
          </ErrorSection>
        </ErrorSectionContainer>
        <CustomTooltip title="To view the content of this page, switch to an organization where you have more roles using the 'Switch Organization' field.">
          <IconWrapper>
            <InfoCircleIcon height={32} width={32} />
          </IconWrapper>
        </CustomTooltip>
      </ErrorContainer>
      <StyledButton href="/" variant="contained">
        Return to Dashboard
      </StyledButton>
      <Typography variant="textB1Regular" component="p" align="center">
        For more help, please inquire on the
        <ErrorLink href="https://meshery.io/community#community-forums">
          {' '}
          discussion forum
        </ErrorLink>{' '}
        or the <ErrorLink href="https://slack.meshery.io"> Slack workspace</ErrorLink>.
      </Typography>
    </ErrorMain>
  );
};

export default DefaultError;
