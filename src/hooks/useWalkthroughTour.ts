import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useWalkthroughTour() {
  useEffect(() => {
    // Only run if the user hasn't completed it yet
    const isDone = localStorage.getItem('oidc-sandbox-tour-done') === 'true';
    if (isDone) return;

    const driverObj = driver({
      showProgress: true,
      animate: true,
      popoverClass: 'theme-dark',
      steps: [
        {
          element: '#tour-palette',
          popover: {
            title: '1. Build Your Architecture',
            description: 'Drag and drop standard OAuth/OIDC components — like SPAs, BFFs, and Identity Providers — onto the canvas.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '.react-flow',
          popover: {
            title: '2. Connect the Pieces',
            description: 'Draw connections between them. If they match a valid protocol (e.g. Auth Code + PKCE), the timeline will appear at the bottom.',
            side: 'top',
            align: 'center'
          }
        },
        {
          element: '#tour-actions',
          popover: {
            title: '3. Configure & Attack',
            description: 'Toggle Attack Mode to simulate brutal vulnerabilities like XSS Token Theft, or export your final architecture as a PNG.',
            side: 'bottom',
            align: 'end'
          }
        }
      ],
      onDestroyed: () => {
        localStorage.setItem('oidc-sandbox-tour-done', 'true');
      }
    });

    // Slight delay to ensure React Flow canvas is rendered and bounds are calculated
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 600);

    return () => clearTimeout(timer);
  }, []);
}
