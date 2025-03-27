import { createFileRoute } from '@tanstack/react-router';
import * as React from 'react';
import UserPageLayout from '@/components/nav/user-page-layout.tsx';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/_dashboard/user/files')({
  component: FilesPage,
});

function FilesPage() {
  const { t } = useTranslation('common');

  return (
    <UserPageLayout showUserCrumb={true} pageName={t('pageName.files')}>
      WebDAV, something, something
    </UserPageLayout>
  );
}
