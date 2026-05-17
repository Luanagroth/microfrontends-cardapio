import { useEffect } from 'react';

export function useActiveSection({
  route,
  cardapioRoute,
  navLockUntilRef,
  setActiveNav
}) {
  useEffect(() => {
    if (route === cardapioRoute) return undefined;

    const sectionIds = ['inicio', 'reservas', 'curriculos', 'contato'];

    const updateActiveByScroll = () => {
      if (Date.now() < navLockUntilRef.current) return;

      const header = document.querySelector('.public-header');
      const headerOffset = header ? header.getBoundingClientRect().height : 0;
      const probeY = window.scrollY + headerOffset + 20;
      const anchors = sectionIds
        .map((id) => {
          const element = document.getElementById(id);
          return element ? { id, top: element.offsetTop } : null;
        })
        .filter(Boolean);
      if (!anchors.length) return;

      let current = anchors[0].id;
      for (let index = 0; index < anchors.length - 1; index += 1) {
        const currentAnchor = anchors[index];
        const nextAnchor = anchors[index + 1];
        const boundary = (currentAnchor.top + nextAnchor.top) / 2;
        if (probeY >= boundary) current = nextAnchor.id;
      }

      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 16;
      if (nearBottom) current = 'contato';

      setActiveNav(current);
    };

    updateActiveByScroll();
    window.addEventListener('scroll', updateActiveByScroll, { passive: true });
    window.addEventListener('resize', updateActiveByScroll);
    return () => {
      window.removeEventListener('scroll', updateActiveByScroll);
      window.removeEventListener('resize', updateActiveByScroll);
    };
  }, [cardapioRoute, navLockUntilRef, route, setActiveNav]);
}
