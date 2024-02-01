import PropTypes from 'prop-types';

import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import classNames from 'classnames';
import { withRouter } from 'react-router-dom';

import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';

import AttachmentList from 'flavours/blobfox/components/attachment_list';
import { Avatar } from 'flavours/blobfox/components/avatar';
import { Button } from 'flavours/blobfox/components/button';
import { DisplayName } from 'flavours/blobfox/components/display_name';
import { Icon } from 'flavours/blobfox/components/icon';
import { RelativeTimestamp } from 'flavours/blobfox/components/relative_timestamp';
import StatusContent from 'flavours/blobfox/components/status_content';
import VisibilityIcon from 'flavours/blobfox/components/status_visibility_icon';
import { WithRouterPropTypes } from 'flavours/blobfox/utils/react_router';

const messages = defineMessages({
  favourite: { id: 'status.favourite', defaultMessage: 'Favorite' },
});

class FavouriteModal extends ImmutablePureComponent {

  static propTypes = {
    status: ImmutablePropTypes.map.isRequired,
    onFavourite: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    ...WithRouterPropTypes,
  };

  handleFavourite = () => {
    this.props.onFavourite(this.props.status);
    this.props.onClose();
  };

  handleAccountClick = (e) => {
    if (e.button === 0) {
      e.preventDefault();
      this.props.onClose();
      this.props.history.push(`/@${this.props.status.getIn(['account', 'acct'])}`);
    }
  };

  render () {
    const { status, intl } = this.props;

    return (
      <div className='modal-root__modal boost-modal'>
        <div className='boost-modal__container'>
          <div className={classNames('status', `status-${status.get('visibility')}`, 'light')}>
            <div className='boost-modal__status-header'>
              <div className='boost-modal__status-time'>
                <a href={status.get('url')} className='status__relative-time' target='_blank' rel='noopener noreferrer'>
                  <VisibilityIcon visibility={status.get('visibility')} />
                  <RelativeTimestamp timestamp={status.get('created_at')} />
                </a>
              </div>

              <a onClick={this.handleAccountClick} href={status.getIn(['account', 'url'])} className='status__display-name'>
                <div className='status__avatar'>
                  <Avatar account={status.get('account')} size={48} />
                </div>

                <DisplayName account={status.get('account')} />

              </a>
            </div>

            <StatusContent status={status} />

            {status.get('media_attachments').size > 0 && (
              <AttachmentList
                compact
                media={status.get('media_attachments')}
              />
            )}
          </div>
        </div>

        <div className='boost-modal__action-bar'>
          <div><FormattedMessage id='favourite_modal.combo' defaultMessage='You can press {combo} to skip this next time' values={{ combo: <span>Shift + <Icon id='star' /></span> }} /></div>
          <Button text={intl.formatMessage(messages.favourite)} onClick={this.handleFavourite} autoFocus />
        </div>
      </div>
    );
  }

}

export default withRouter(injectIntl(FavouriteModal));
