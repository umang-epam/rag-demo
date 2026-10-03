'use client';

import { Suspense } from 'react';
import { UuiContext, useUuiServices, useNextAppRouter } from '@epam/uui-core';
import { ErrorHandler, Snackbar } from '@epam/uui';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

function UuiServicesInner({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const routerAdapter = useNextAppRouter({ router, pathname, searchParams });

  const { services } = useUuiServices({
    router: routerAdapter,
  });

  return (
    <UuiContext.Provider value={services}>
      <ErrorHandler>
        {children}
        <Snackbar />
      </ErrorHandler>
    </UuiContext.Provider>
  );
}

export function UuiProvider({ children }) {
  return (
    <Suspense fallback={null}>
      <UuiServicesInner>{children}</UuiServicesInner>
    </Suspense>
  );
}
