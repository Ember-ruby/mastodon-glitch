import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { defineMessages, injectIntl, FormattedMessage } from 'react-intl';

import classNames from 'classnames';

import { is } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';

import { debounce } from 'lodash';

import VisibilityOffIcon from '@/material-icons/400-24px/visibility_off.svg?react';
import { Blurhash } from 'flavours/glitch/components/blurhash';

import { autoPlayGif, displayMedia, useBlurhash } from '../initial_state';

import { IconButton } from './icon_button';

const messages = defineMessages({
  hidden: {
    defaultMessage: 'Media hidden',
    id: 'status.media_hidden',
  },
  sensitive: {
    defaultMessage: 'Sensitive',
    id: 'media_gallery.sensitive',
  },
  toggle: {
    defaultMessage: 'Click to view',
    id: 'status.sensitive_toggle',
  },
  toggle_visible: {
    defaultMessage: '{number, plural, one {Hide image} other {Hide images}}',
    id: 'media_gallery.toggle_visible',
  },
  warning: {
    defaultMessage: 'Sensitive content',
    id: 'status.sensitive_warning',
  },
});

const colCount = function(size) {
  return Math.max(Math.ceil(Math.sqrt(size)), 2);
};

const rowCount = function(size) {
  return Math.ceil(size / colCount(size));
};

class Item extends PureComponent {

  static propTypes = {
    attachment: ImmutablePropTypes.map.isRequired,
    lang: PropTypes.string,
    standalone: PropTypes.bool,
    index: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired,
    letterbox: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    displayWidth: PropTypes.number,
    visible: PropTypes.bool.isRequired,
    autoplay: PropTypes.bool,
    onAltClick: PropTypes.func.isRequired,
  };

  static defaultProps = {
    standalone: false,
    index: 0,
    size: 1,
  };

  state = {
    loaded: false,
  };

  handleMouseEnter = (e) => {
    if (this.hoverToPlay()) {
      e.target.play();
    }
  };

  handleMouseLeave = (e) => {
    if (this.hoverToPlay()) {
      e.target.pause();
      e.target.currentTime = 0;
    }
  };

  getAutoPlay() {
    return this.props.autoplay || autoPlayGif;
  }

  hoverToPlay () {
    const { attachment } = this.props;
    return !this.getAutoPlay() && attachment.get('type') === 'gifv';
  }

  handleClick = (e) => {
    const { index, onClick } = this.props;

    if (e.button === 0 && !(e.ctrlKey || e.metaKey)) {
      if (this.hoverToPlay()) {
        e.target.pause();
        e.target.currentTime = 0;
      }
      e.preventDefault();
      onClick(index);
    }

    e.stopPropagation();
  };

  handleAltClick = (e) => {
    const { index, onAltClick } = this.props;

    // prevent image to open in a new tab
    e.preventDefault();

    // open modal
    onAltClick(index);

    // Prevents opening of media modal
    e.stopPropagation();
  };

  handleImageLoad = () => {
    this.setState({ loaded: true });
  };

  render () {
    const { attachment, lang, index, size, standalone, letterbox, displayWidth, visible } = this.props;

    let badges = [], thumbnail;

    let width  = 50;
    let height = 50;

    const cols = colCount(size);
    const remaining = (-size % cols + cols) % cols;
    const largeCount = Math.floor(remaining / 3); // width=2, height=2

    const mediumCount = remaining % 3; // height=2

    if (size === 1 || index < largeCount) {
      width = 100;
      height = 100;
    } else if (size === 2 || index < largeCount + mediumCount) {
      height = 100;
    }

    if (attachment.get('description')?.length > 0) {
      badges.push(<button key='alt' type='button' className='media-gallery__alt__label' onClick={this.handleAltClick}><span>ALT</span></button>);
    }

    const description = attachment.getIn(['translation', 'description']) || attachment.get('description');

    if (attachment.get('type') === 'unknown') {
      return (
        <div className={classNames('media-gallery__item', { standalone, 'media-gallery__item--tall': height === 100, 'media-gallery__item--wide': width === 100 })} key={attachment.get('id')}>
          <a className='media-gallery__item-thumbnail' href={attachment.get('remote_url') || attachment.get('url')} style={{ cursor: 'pointer' }} title={description} lang={lang} target='_blank' rel='noopener noreferrer'>
            <Blurhash
              hash={attachment.get('blurhash')}
              className='media-gallery__preview'
              dummy={!useBlurhash}
            />
          </a>
        </div>
      );
    } else if (attachment.get('type') === 'image') {
      const previewUrl   = attachment.get('preview_url');
      const previewWidth = attachment.getIn(['meta', 'small', 'width']);

      const originalUrl   = attachment.get('url');
      const originalWidth = attachment.getIn(['meta', 'original', 'width']);

      const hasSize = typeof originalWidth === 'number' && typeof previewWidth === 'number';

      const srcSet = hasSize ? `${originalUrl} ${originalWidth}w, ${previewUrl} ${previewWidth}w` : null;
      const sizes  = hasSize && (displayWidth > 0) ? `${displayWidth * (width / 100)}px` : null;

      const focusX = attachment.getIn(['meta', 'focus', 'x']) || 0;
      const focusY = attachment.getIn(['meta', 'focus', 'y']) || 0;
      const x      = ((focusX /  2) + .5) * 100;
      const y      = ((focusY / -2) + .5) * 100;

      thumbnail = (
        <a
          className='media-gallery__item-thumbnail'
          href={attachment.get('remote_url') || originalUrl}
          onClick={this.handleClick}
          target='_blank'
          rel='noopener noreferrer'
        >
          <img
            className={letterbox ? 'letterbox' : null}
            src={previewUrl}
            srcSet={srcSet}
            sizes={sizes}
            alt={description}
            title={description}
            lang={lang}
            style={{ objectPosition: letterbox ? null : `${x}% ${y}%` }}
            onLoad={this.handleImageLoad}
          />
        </a>
      );
    } else if (attachment.get('type') === 'gifv') {
      const autoPlay = this.getAutoPlay();

      badges.push(<span key='gif' className='media-gallery__gifv__label'>GIF</span>);

      thumbnail = (
        <div className={classNames('media-gallery__gifv', { autoplay: autoPlay })}>
          <video
            className={`media-gallery__item-gifv-thumbnail${letterbox ? ' letterbox' : ''}`}
            aria-label={description}
            title={description}
            lang={lang}
            role='application'
            src={attachment.get('url')}
            onClick={this.handleClick}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            autoPlay={autoPlay}
            playsInline
            loop
            muted
          />
        </div>
      );
    }

    return (
      <div className={classNames('media-gallery__item', { standalone, letterbox, 'media-gallery__item--tall': height === 100, 'media-gallery__item--wide': width === 100 })} key={attachment.get('id')}>
        <Blurhash
          hash={attachment.get('blurhash')}
          dummy={!useBlurhash}
          className={classNames('media-gallery__preview', {
            'media-gallery__preview--hidden': visible && this.state.loaded,
          })}
        />

        {visible && thumbnail}

        {badges && (
          <div className='media-gallery__item__badges'>
            {badges}
          </div>
        )}
      </div>
    );
  }

}

class MediaGallery extends PureComponent {

  static propTypes = {
    sensitive: PropTypes.bool,
    standalone: PropTypes.bool,
    letterbox: PropTypes.bool,
    fullwidth: PropTypes.bool,
    hidden: PropTypes.bool,
    media: ImmutablePropTypes.list.isRequired,
    lang: PropTypes.string,
    size: PropTypes.object,
    onOpenMedia: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
    defaultWidth: PropTypes.number,
    cacheWidth: PropTypes.func,
    visible: PropTypes.bool,
    autoplay: PropTypes.bool,
    onToggleVisibility: PropTypes.func,
    onOpenAltText: PropTypes.func,
  };

  static defaultProps = {
    standalone: false,
  };

  state = {
    visible: this.props.visible !== undefined ? this.props.visible : (displayMedia !== 'hide_all' && !this.props.sensitive || displayMedia === 'show_all'),
    width: this.props.defaultWidth,
  };

  componentDidMount () {
    window.addEventListener('resize', this.handleResize, { passive: true });
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    if (!is(nextProps.media, this.props.media) && nextProps.visible === undefined) {
      this.setState({ visible: displayMedia !== 'hide_all' && !nextProps.sensitive || displayMedia === 'show_all' });
    } else if (!is(nextProps.visible, this.props.visible) && nextProps.visible !== undefined) {
      this.setState({ visible: nextProps.visible });
    }
  }

  componentDidUpdate () {
    if (this.node) {
      this.handleResize();
    }
  }

  handleResize = debounce(() => {
    if (this.node) {
      this._setDimensions();
    }
  }, 250, {
    leading: true,
    trailing: true,
  });

  handleOpen = () => {
    if (this.props.onToggleVisibility) {
      this.props.onToggleVisibility();
    } else {
      this.setState({ visible: !this.state.visible });
    }
  };

  handleClick = (index) => {
    this.props.onOpenMedia(this.props.media, index, this.props.lang);
  };

  handleAltClick = (index) => {
    this.props.onOpenAltText(index);
  };

  handleRef = (node) => {
    this.node = node;

    if (this.node) {
      this._setDimensions();
    }
  };

  _setDimensions () {
    const width = this.node.offsetWidth;

    if (width && width !== this.state.width) {
      // offsetWidth triggers a layout, so only calculate when we need to
      if (this.props.cacheWidth) {
        this.props.cacheWidth(width);
      }

      this.setState({
        width: width,
      });
    }
  }

  isStandaloneEligible() {
    const { media, standalone } = this.props;
    return standalone && media.size === 1 && media.getIn([0, 'meta', 'small', 'aspect']);
  }

  render () {
    const { media, lang, intl, sensitive, letterbox, fullwidth, defaultWidth, autoplay } = this.props;
    const { visible } = this.state;
    const size     = media.size;
    const uncached = media.every(attachment => attachment.get('type') === 'unknown');

    const width = this.state.width || defaultWidth;

    let children, spoilerButton;

    const style = {};

    const computedClass = classNames('media-gallery', { 'full-width': fullwidth });

    if (this.isStandaloneEligible()) { // TODO: cropImages setting
      style.aspectRatio = `${this.props.media.getIn([0, 'meta', 'small', 'aspect'])}`;
    } else {
      const cols = colCount(media.size);
      const rows = rowCount(media.size);
      style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
      style.gridTemplateRows = `repeat(${rows}, 1fr)`;

      style.aspectRatio = '3 / 2';
    }

    if (this.isStandaloneEligible()) {
      children = <Item standalone autoplay={autoplay} onClick={this.handleClick} onAltClick={this.handleAltClick} attachment={media.get(0)} lang={lang} displayWidth={width} visible={visible} />;
    } else {
      children = media.map((attachment, i) => <Item key={attachment.get('id')} autoplay={autoplay} onAltClick={this.handleAltClick} onClick={this.handleClick} attachment={attachment} index={i} lang={lang} size={size} displayWidth={width} visible={visible || uncached} />);
    }

    if (uncached) {
      spoilerButton = (
        <button type='button' disabled className='spoiler-button__overlay'>
          <span className='spoiler-button__overlay__label'>
            <FormattedMessage id='status.uncached_media_warning' defaultMessage='Preview not available' />
            <span className='spoiler-button__overlay__action'><FormattedMessage id='status.media.open' defaultMessage='Click to open' /></span>
          </span>
        </button>
      );
    } else if (visible) {
      spoilerButton = <IconButton title={intl.formatMessage(messages.toggle_visible, { number: size })} icon='eye-slash' iconComponent={VisibilityOffIcon} overlay onClick={this.handleOpen} ariaHidden />;
    } else {
      spoilerButton = (
        <button type='button' onClick={this.handleOpen} className='spoiler-button__overlay'>
          <span className='spoiler-button__overlay__label'>
            {sensitive ? <FormattedMessage id='status.sensitive_warning' defaultMessage='Sensitive content' /> : <FormattedMessage id='status.media_hidden' defaultMessage='Media hidden' />}
            <span className='spoiler-button__overlay__action'><FormattedMessage id='status.media.show' defaultMessage='Click to show' /></span>
          </span>
        </button>
      );
    }

    return (
      <div className={computedClass} style={style} ref={this.handleRef}>
        <div className={classNames('spoiler-button', { 'spoiler-button--minified': visible && !uncached, 'spoiler-button--click-thru': uncached })}>
          {spoilerButton}
          {visible && sensitive && (
            <span className='sensitive-marker'>
              <FormattedMessage {...messages.sensitive} />
            </span>
          )}
        </div>

        {children}
      </div>
    );
  }

}

export default injectIntl(MediaGallery);
