import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import classNames from 'classnames';

import { Icon }  from 'flavours/blobfox/components/icon';

export default class ColumnHeader extends PureComponent {

  static propTypes = {
    icon: PropTypes.string,
    type: PropTypes.string,
    active: PropTypes.bool,
    onClick: PropTypes.func,
    columnHeaderId: PropTypes.string,
  };

  handleClick = () => {
    this.props.onClick();
  };

  render () {
    const { icon, type, active, columnHeaderId } = this.props;
    let iconElement = '';

    if (icon) {
      iconElement = <Icon id={icon} fixedWidth className='column-header__icon' />;
    }

    return (
      <h1 className={classNames('column-header', { active })} id={columnHeaderId || null}>
        <button onClick={this.handleClick}>
          {iconElement}
          {type}
        </button>
      </h1>
    );
  }

}
