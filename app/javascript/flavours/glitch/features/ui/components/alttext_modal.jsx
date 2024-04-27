import PropTypes from 'prop-types';

import { injectIntl, FormattedMessage } from 'react-intl';

import ImmutablePropTypes from 'react-immutable-proptypes';
import ImmutablePureComponent from 'react-immutable-pure-component';

import { Button } from 'flavours/glitch/components/button';

class AltTextModal extends ImmutablePureComponent {

  static contextTypes = {
    router: PropTypes.object,
  };

  static propTypes = {
    media: ImmutablePropTypes.map.isRequired,
    statusId: PropTypes.string,
    onClose: PropTypes.func.isRequired,
  };

  render () {
    const { media, onClose } = this.props;

    return (
      <div className='modal-root__modal alttext-modal'>
        <div className='alttext-modal__container'>
          <pre>{media.get('description')}</pre>
        </div>
        <div className='alttext-modal__action-bar'>
          <Button onClick={onClose} className='alttext-modal__button'>
            <FormattedMessage id='lightbox.close' defaultMessage='Close' />
          </Button>
        </div>
      </div>
    );
  }

}

export default injectIntl(AltTextModal);