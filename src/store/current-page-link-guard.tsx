import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CURRENT_LINK_ATTRIBUTE = 'data-current-page-link';

const isCurrentPageLink = (link: HTMLAnchorElement) => {
  const current = new URL(window.location.href);
  const destination = new URL(link.href, current);
  return (
    destination.origin === current.origin &&
    destination.pathname === current.pathname &&
    destination.search === current.search &&
    destination.hash === current.hash
  );
};

const syncCurrentPageLinks = () => {
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    const isCurrent = isCurrentPageLink(link);
    if (isCurrent) {
      link.setAttribute(CURRENT_LINK_ATTRIBUTE, 'true');
      link.setAttribute('aria-disabled', 'true');
      link.setAttribute('tabindex', '-1');
      return;
    }

    if (!link.hasAttribute(CURRENT_LINK_ATTRIBUTE)) return;
    link.removeAttribute(CURRENT_LINK_ATTRIBUTE);
    link.removeAttribute('aria-disabled');
    link.removeAttribute('tabindex');
  });
};

const CurrentPageLinkGuard = () => {
  const location = useLocation();

  useEffect(() => {
    syncCurrentPageLinks();
    const observer =
      typeof MutationObserver === 'undefined' ? null : new MutationObserver(syncCurrentPageLinks);
    observer?.observe(document.body, { childList: true, subtree: true });
    return () => observer?.disconnect();
  }, [location.pathname, location.search, location.hash]);

  return null;
};

export default CurrentPageLinkGuard;
