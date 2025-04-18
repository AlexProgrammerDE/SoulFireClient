/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file was automatically generated by TanStack Router.
// You should NOT make any changes in this file as it will be overwritten.
// Additionally, you should also exclude this file from your linter and/or formatter to prevent it from being checked or modified.

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as DashboardImport } from './routes/_dashboard'
import { Route as IndexImport } from './routes/index'
import { Route as DashboardUserImport } from './routes/_dashboard/user'
import { Route as DashboardUserIndexImport } from './routes/_dashboard/user/index'
import { Route as DashboardUserSettingsImport } from './routes/_dashboard/user/settings'
import { Route as DashboardUserAdminImport } from './routes/_dashboard/user/admin'
import { Route as DashboardUserAccessImport } from './routes/_dashboard/user/access'
import { Route as DashboardInstanceInstanceImport } from './routes/_dashboard/instance/$instance'
import { Route as DashboardUserAdminIndexImport } from './routes/_dashboard/user/admin/index'
import { Route as DashboardInstanceInstanceIndexImport } from './routes/_dashboard/instance/$instance/index'
import { Route as DashboardUserAdminUsersImport } from './routes/_dashboard/user/admin/users'
import { Route as DashboardUserAdminScriptsImport } from './routes/_dashboard/user/admin/scripts'
import { Route as DashboardUserAdminConsoleImport } from './routes/_dashboard/user/admin/console'
import { Route as DashboardInstanceInstanceScriptsImport } from './routes/_dashboard/instance/$instance/scripts'
import { Route as DashboardInstanceInstanceProxiesImport } from './routes/_dashboard/instance/$instance/proxies'
import { Route as DashboardInstanceInstanceMetaImport } from './routes/_dashboard/instance/$instance/meta'
import { Route as DashboardInstanceInstanceDiscoverImport } from './routes/_dashboard/instance/$instance/discover'
import { Route as DashboardInstanceInstanceAuditLogImport } from './routes/_dashboard/instance/$instance/audit-log'
import { Route as DashboardInstanceInstanceAccountsImport } from './routes/_dashboard/instance/$instance/accounts'
import { Route as DashboardUserAdminSettingsNamespaceImport } from './routes/_dashboard/user/admin/settings/$namespace'
import { Route as DashboardInstanceInstanceSettingsNamespaceImport } from './routes/_dashboard/instance/$instance/settings/$namespace'

// Create/Update Routes

const DashboardRoute = DashboardImport.update({
  id: '/_dashboard',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const DashboardUserRoute = DashboardUserImport.update({
  id: '/user',
  path: '/user',
  getParentRoute: () => DashboardRoute,
} as any)

const DashboardUserIndexRoute = DashboardUserIndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => DashboardUserRoute,
} as any)

const DashboardUserSettingsRoute = DashboardUserSettingsImport.update({
  id: '/settings',
  path: '/settings',
  getParentRoute: () => DashboardUserRoute,
} as any)

const DashboardUserAdminRoute = DashboardUserAdminImport.update({
  id: '/admin',
  path: '/admin',
  getParentRoute: () => DashboardUserRoute,
} as any)

const DashboardUserAccessRoute = DashboardUserAccessImport.update({
  id: '/access',
  path: '/access',
  getParentRoute: () => DashboardUserRoute,
} as any)

const DashboardInstanceInstanceRoute = DashboardInstanceInstanceImport.update({
  id: '/instance/$instance',
  path: '/instance/$instance',
  getParentRoute: () => DashboardRoute,
} as any)

const DashboardUserAdminIndexRoute = DashboardUserAdminIndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => DashboardUserAdminRoute,
} as any)

const DashboardInstanceInstanceIndexRoute =
  DashboardInstanceInstanceIndexImport.update({
    id: '/',
    path: '/',
    getParentRoute: () => DashboardInstanceInstanceRoute,
  } as any)

const DashboardUserAdminUsersRoute = DashboardUserAdminUsersImport.update({
  id: '/users',
  path: '/users',
  getParentRoute: () => DashboardUserAdminRoute,
} as any)

const DashboardUserAdminScriptsRoute = DashboardUserAdminScriptsImport.update({
  id: '/scripts',
  path: '/scripts',
  getParentRoute: () => DashboardUserAdminRoute,
} as any)

const DashboardUserAdminConsoleRoute = DashboardUserAdminConsoleImport.update({
  id: '/console',
  path: '/console',
  getParentRoute: () => DashboardUserAdminRoute,
} as any)

const DashboardInstanceInstanceScriptsRoute =
  DashboardInstanceInstanceScriptsImport.update({
    id: '/scripts',
    path: '/scripts',
    getParentRoute: () => DashboardInstanceInstanceRoute,
  } as any)

const DashboardInstanceInstanceProxiesRoute =
  DashboardInstanceInstanceProxiesImport.update({
    id: '/proxies',
    path: '/proxies',
    getParentRoute: () => DashboardInstanceInstanceRoute,
  } as any)

const DashboardInstanceInstanceMetaRoute =
  DashboardInstanceInstanceMetaImport.update({
    id: '/meta',
    path: '/meta',
    getParentRoute: () => DashboardInstanceInstanceRoute,
  } as any)

const DashboardInstanceInstanceDiscoverRoute =
  DashboardInstanceInstanceDiscoverImport.update({
    id: '/discover',
    path: '/discover',
    getParentRoute: () => DashboardInstanceInstanceRoute,
  } as any)

const DashboardInstanceInstanceAuditLogRoute =
  DashboardInstanceInstanceAuditLogImport.update({
    id: '/audit-log',
    path: '/audit-log',
    getParentRoute: () => DashboardInstanceInstanceRoute,
  } as any)

const DashboardInstanceInstanceAccountsRoute =
  DashboardInstanceInstanceAccountsImport.update({
    id: '/accounts',
    path: '/accounts',
    getParentRoute: () => DashboardInstanceInstanceRoute,
  } as any)

const DashboardUserAdminSettingsNamespaceRoute =
  DashboardUserAdminSettingsNamespaceImport.update({
    id: '/settings/$namespace',
    path: '/settings/$namespace',
    getParentRoute: () => DashboardUserAdminRoute,
  } as any)

const DashboardInstanceInstanceSettingsNamespaceRoute =
  DashboardInstanceInstanceSettingsNamespaceImport.update({
    id: '/settings/$namespace',
    path: '/settings/$namespace',
    getParentRoute: () => DashboardInstanceInstanceRoute,
  } as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/_dashboard': {
      id: '/_dashboard'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof DashboardImport
      parentRoute: typeof rootRoute
    }
    '/_dashboard/user': {
      id: '/_dashboard/user'
      path: '/user'
      fullPath: '/user'
      preLoaderRoute: typeof DashboardUserImport
      parentRoute: typeof DashboardImport
    }
    '/_dashboard/instance/$instance': {
      id: '/_dashboard/instance/$instance'
      path: '/instance/$instance'
      fullPath: '/instance/$instance'
      preLoaderRoute: typeof DashboardInstanceInstanceImport
      parentRoute: typeof DashboardImport
    }
    '/_dashboard/user/access': {
      id: '/_dashboard/user/access'
      path: '/access'
      fullPath: '/user/access'
      preLoaderRoute: typeof DashboardUserAccessImport
      parentRoute: typeof DashboardUserImport
    }
    '/_dashboard/user/admin': {
      id: '/_dashboard/user/admin'
      path: '/admin'
      fullPath: '/user/admin'
      preLoaderRoute: typeof DashboardUserAdminImport
      parentRoute: typeof DashboardUserImport
    }
    '/_dashboard/user/settings': {
      id: '/_dashboard/user/settings'
      path: '/settings'
      fullPath: '/user/settings'
      preLoaderRoute: typeof DashboardUserSettingsImport
      parentRoute: typeof DashboardUserImport
    }
    '/_dashboard/user/': {
      id: '/_dashboard/user/'
      path: '/'
      fullPath: '/user/'
      preLoaderRoute: typeof DashboardUserIndexImport
      parentRoute: typeof DashboardUserImport
    }
    '/_dashboard/instance/$instance/accounts': {
      id: '/_dashboard/instance/$instance/accounts'
      path: '/accounts'
      fullPath: '/instance/$instance/accounts'
      preLoaderRoute: typeof DashboardInstanceInstanceAccountsImport
      parentRoute: typeof DashboardInstanceInstanceImport
    }
    '/_dashboard/instance/$instance/audit-log': {
      id: '/_dashboard/instance/$instance/audit-log'
      path: '/audit-log'
      fullPath: '/instance/$instance/audit-log'
      preLoaderRoute: typeof DashboardInstanceInstanceAuditLogImport
      parentRoute: typeof DashboardInstanceInstanceImport
    }
    '/_dashboard/instance/$instance/discover': {
      id: '/_dashboard/instance/$instance/discover'
      path: '/discover'
      fullPath: '/instance/$instance/discover'
      preLoaderRoute: typeof DashboardInstanceInstanceDiscoverImport
      parentRoute: typeof DashboardInstanceInstanceImport
    }
    '/_dashboard/instance/$instance/meta': {
      id: '/_dashboard/instance/$instance/meta'
      path: '/meta'
      fullPath: '/instance/$instance/meta'
      preLoaderRoute: typeof DashboardInstanceInstanceMetaImport
      parentRoute: typeof DashboardInstanceInstanceImport
    }
    '/_dashboard/instance/$instance/proxies': {
      id: '/_dashboard/instance/$instance/proxies'
      path: '/proxies'
      fullPath: '/instance/$instance/proxies'
      preLoaderRoute: typeof DashboardInstanceInstanceProxiesImport
      parentRoute: typeof DashboardInstanceInstanceImport
    }
    '/_dashboard/instance/$instance/scripts': {
      id: '/_dashboard/instance/$instance/scripts'
      path: '/scripts'
      fullPath: '/instance/$instance/scripts'
      preLoaderRoute: typeof DashboardInstanceInstanceScriptsImport
      parentRoute: typeof DashboardInstanceInstanceImport
    }
    '/_dashboard/user/admin/console': {
      id: '/_dashboard/user/admin/console'
      path: '/console'
      fullPath: '/user/admin/console'
      preLoaderRoute: typeof DashboardUserAdminConsoleImport
      parentRoute: typeof DashboardUserAdminImport
    }
    '/_dashboard/user/admin/scripts': {
      id: '/_dashboard/user/admin/scripts'
      path: '/scripts'
      fullPath: '/user/admin/scripts'
      preLoaderRoute: typeof DashboardUserAdminScriptsImport
      parentRoute: typeof DashboardUserAdminImport
    }
    '/_dashboard/user/admin/users': {
      id: '/_dashboard/user/admin/users'
      path: '/users'
      fullPath: '/user/admin/users'
      preLoaderRoute: typeof DashboardUserAdminUsersImport
      parentRoute: typeof DashboardUserAdminImport
    }
    '/_dashboard/instance/$instance/': {
      id: '/_dashboard/instance/$instance/'
      path: '/'
      fullPath: '/instance/$instance/'
      preLoaderRoute: typeof DashboardInstanceInstanceIndexImport
      parentRoute: typeof DashboardInstanceInstanceImport
    }
    '/_dashboard/user/admin/': {
      id: '/_dashboard/user/admin/'
      path: '/'
      fullPath: '/user/admin/'
      preLoaderRoute: typeof DashboardUserAdminIndexImport
      parentRoute: typeof DashboardUserAdminImport
    }
    '/_dashboard/instance/$instance/settings/$namespace': {
      id: '/_dashboard/instance/$instance/settings/$namespace'
      path: '/settings/$namespace'
      fullPath: '/instance/$instance/settings/$namespace'
      preLoaderRoute: typeof DashboardInstanceInstanceSettingsNamespaceImport
      parentRoute: typeof DashboardInstanceInstanceImport
    }
    '/_dashboard/user/admin/settings/$namespace': {
      id: '/_dashboard/user/admin/settings/$namespace'
      path: '/settings/$namespace'
      fullPath: '/user/admin/settings/$namespace'
      preLoaderRoute: typeof DashboardUserAdminSettingsNamespaceImport
      parentRoute: typeof DashboardUserAdminImport
    }
  }
}

// Create and export the route tree

interface DashboardUserAdminRouteChildren {
  DashboardUserAdminConsoleRoute: typeof DashboardUserAdminConsoleRoute
  DashboardUserAdminScriptsRoute: typeof DashboardUserAdminScriptsRoute
  DashboardUserAdminUsersRoute: typeof DashboardUserAdminUsersRoute
  DashboardUserAdminIndexRoute: typeof DashboardUserAdminIndexRoute
  DashboardUserAdminSettingsNamespaceRoute: typeof DashboardUserAdminSettingsNamespaceRoute
}

const DashboardUserAdminRouteChildren: DashboardUserAdminRouteChildren = {
  DashboardUserAdminConsoleRoute: DashboardUserAdminConsoleRoute,
  DashboardUserAdminScriptsRoute: DashboardUserAdminScriptsRoute,
  DashboardUserAdminUsersRoute: DashboardUserAdminUsersRoute,
  DashboardUserAdminIndexRoute: DashboardUserAdminIndexRoute,
  DashboardUserAdminSettingsNamespaceRoute:
    DashboardUserAdminSettingsNamespaceRoute,
}

const DashboardUserAdminRouteWithChildren =
  DashboardUserAdminRoute._addFileChildren(DashboardUserAdminRouteChildren)

interface DashboardUserRouteChildren {
  DashboardUserAccessRoute: typeof DashboardUserAccessRoute
  DashboardUserAdminRoute: typeof DashboardUserAdminRouteWithChildren
  DashboardUserSettingsRoute: typeof DashboardUserSettingsRoute
  DashboardUserIndexRoute: typeof DashboardUserIndexRoute
}

const DashboardUserRouteChildren: DashboardUserRouteChildren = {
  DashboardUserAccessRoute: DashboardUserAccessRoute,
  DashboardUserAdminRoute: DashboardUserAdminRouteWithChildren,
  DashboardUserSettingsRoute: DashboardUserSettingsRoute,
  DashboardUserIndexRoute: DashboardUserIndexRoute,
}

const DashboardUserRouteWithChildren = DashboardUserRoute._addFileChildren(
  DashboardUserRouteChildren,
)

interface DashboardInstanceInstanceRouteChildren {
  DashboardInstanceInstanceAccountsRoute: typeof DashboardInstanceInstanceAccountsRoute
  DashboardInstanceInstanceAuditLogRoute: typeof DashboardInstanceInstanceAuditLogRoute
  DashboardInstanceInstanceDiscoverRoute: typeof DashboardInstanceInstanceDiscoverRoute
  DashboardInstanceInstanceMetaRoute: typeof DashboardInstanceInstanceMetaRoute
  DashboardInstanceInstanceProxiesRoute: typeof DashboardInstanceInstanceProxiesRoute
  DashboardInstanceInstanceScriptsRoute: typeof DashboardInstanceInstanceScriptsRoute
  DashboardInstanceInstanceIndexRoute: typeof DashboardInstanceInstanceIndexRoute
  DashboardInstanceInstanceSettingsNamespaceRoute: typeof DashboardInstanceInstanceSettingsNamespaceRoute
}

const DashboardInstanceInstanceRouteChildren: DashboardInstanceInstanceRouteChildren =
  {
    DashboardInstanceInstanceAccountsRoute:
      DashboardInstanceInstanceAccountsRoute,
    DashboardInstanceInstanceAuditLogRoute:
      DashboardInstanceInstanceAuditLogRoute,
    DashboardInstanceInstanceDiscoverRoute:
      DashboardInstanceInstanceDiscoverRoute,
    DashboardInstanceInstanceMetaRoute: DashboardInstanceInstanceMetaRoute,
    DashboardInstanceInstanceProxiesRoute:
      DashboardInstanceInstanceProxiesRoute,
    DashboardInstanceInstanceScriptsRoute:
      DashboardInstanceInstanceScriptsRoute,
    DashboardInstanceInstanceIndexRoute: DashboardInstanceInstanceIndexRoute,
    DashboardInstanceInstanceSettingsNamespaceRoute:
      DashboardInstanceInstanceSettingsNamespaceRoute,
  }

const DashboardInstanceInstanceRouteWithChildren =
  DashboardInstanceInstanceRoute._addFileChildren(
    DashboardInstanceInstanceRouteChildren,
  )

interface DashboardRouteChildren {
  DashboardUserRoute: typeof DashboardUserRouteWithChildren
  DashboardInstanceInstanceRoute: typeof DashboardInstanceInstanceRouteWithChildren
}

const DashboardRouteChildren: DashboardRouteChildren = {
  DashboardUserRoute: DashboardUserRouteWithChildren,
  DashboardInstanceInstanceRoute: DashboardInstanceInstanceRouteWithChildren,
}

const DashboardRouteWithChildren = DashboardRoute._addFileChildren(
  DashboardRouteChildren,
)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '': typeof DashboardRouteWithChildren
  '/user': typeof DashboardUserRouteWithChildren
  '/instance/$instance': typeof DashboardInstanceInstanceRouteWithChildren
  '/user/access': typeof DashboardUserAccessRoute
  '/user/admin': typeof DashboardUserAdminRouteWithChildren
  '/user/settings': typeof DashboardUserSettingsRoute
  '/user/': typeof DashboardUserIndexRoute
  '/instance/$instance/accounts': typeof DashboardInstanceInstanceAccountsRoute
  '/instance/$instance/audit-log': typeof DashboardInstanceInstanceAuditLogRoute
  '/instance/$instance/discover': typeof DashboardInstanceInstanceDiscoverRoute
  '/instance/$instance/meta': typeof DashboardInstanceInstanceMetaRoute
  '/instance/$instance/proxies': typeof DashboardInstanceInstanceProxiesRoute
  '/instance/$instance/scripts': typeof DashboardInstanceInstanceScriptsRoute
  '/user/admin/console': typeof DashboardUserAdminConsoleRoute
  '/user/admin/scripts': typeof DashboardUserAdminScriptsRoute
  '/user/admin/users': typeof DashboardUserAdminUsersRoute
  '/instance/$instance/': typeof DashboardInstanceInstanceIndexRoute
  '/user/admin/': typeof DashboardUserAdminIndexRoute
  '/instance/$instance/settings/$namespace': typeof DashboardInstanceInstanceSettingsNamespaceRoute
  '/user/admin/settings/$namespace': typeof DashboardUserAdminSettingsNamespaceRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '': typeof DashboardRouteWithChildren
  '/user/access': typeof DashboardUserAccessRoute
  '/user/settings': typeof DashboardUserSettingsRoute
  '/user': typeof DashboardUserIndexRoute
  '/instance/$instance/accounts': typeof DashboardInstanceInstanceAccountsRoute
  '/instance/$instance/audit-log': typeof DashboardInstanceInstanceAuditLogRoute
  '/instance/$instance/discover': typeof DashboardInstanceInstanceDiscoverRoute
  '/instance/$instance/meta': typeof DashboardInstanceInstanceMetaRoute
  '/instance/$instance/proxies': typeof DashboardInstanceInstanceProxiesRoute
  '/instance/$instance/scripts': typeof DashboardInstanceInstanceScriptsRoute
  '/user/admin/console': typeof DashboardUserAdminConsoleRoute
  '/user/admin/scripts': typeof DashboardUserAdminScriptsRoute
  '/user/admin/users': typeof DashboardUserAdminUsersRoute
  '/instance/$instance': typeof DashboardInstanceInstanceIndexRoute
  '/user/admin': typeof DashboardUserAdminIndexRoute
  '/instance/$instance/settings/$namespace': typeof DashboardInstanceInstanceSettingsNamespaceRoute
  '/user/admin/settings/$namespace': typeof DashboardUserAdminSettingsNamespaceRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/_dashboard': typeof DashboardRouteWithChildren
  '/_dashboard/user': typeof DashboardUserRouteWithChildren
  '/_dashboard/instance/$instance': typeof DashboardInstanceInstanceRouteWithChildren
  '/_dashboard/user/access': typeof DashboardUserAccessRoute
  '/_dashboard/user/admin': typeof DashboardUserAdminRouteWithChildren
  '/_dashboard/user/settings': typeof DashboardUserSettingsRoute
  '/_dashboard/user/': typeof DashboardUserIndexRoute
  '/_dashboard/instance/$instance/accounts': typeof DashboardInstanceInstanceAccountsRoute
  '/_dashboard/instance/$instance/audit-log': typeof DashboardInstanceInstanceAuditLogRoute
  '/_dashboard/instance/$instance/discover': typeof DashboardInstanceInstanceDiscoverRoute
  '/_dashboard/instance/$instance/meta': typeof DashboardInstanceInstanceMetaRoute
  '/_dashboard/instance/$instance/proxies': typeof DashboardInstanceInstanceProxiesRoute
  '/_dashboard/instance/$instance/scripts': typeof DashboardInstanceInstanceScriptsRoute
  '/_dashboard/user/admin/console': typeof DashboardUserAdminConsoleRoute
  '/_dashboard/user/admin/scripts': typeof DashboardUserAdminScriptsRoute
  '/_dashboard/user/admin/users': typeof DashboardUserAdminUsersRoute
  '/_dashboard/instance/$instance/': typeof DashboardInstanceInstanceIndexRoute
  '/_dashboard/user/admin/': typeof DashboardUserAdminIndexRoute
  '/_dashboard/instance/$instance/settings/$namespace': typeof DashboardInstanceInstanceSettingsNamespaceRoute
  '/_dashboard/user/admin/settings/$namespace': typeof DashboardUserAdminSettingsNamespaceRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | ''
    | '/user'
    | '/instance/$instance'
    | '/user/access'
    | '/user/admin'
    | '/user/settings'
    | '/user/'
    | '/instance/$instance/accounts'
    | '/instance/$instance/audit-log'
    | '/instance/$instance/discover'
    | '/instance/$instance/meta'
    | '/instance/$instance/proxies'
    | '/instance/$instance/scripts'
    | '/user/admin/console'
    | '/user/admin/scripts'
    | '/user/admin/users'
    | '/instance/$instance/'
    | '/user/admin/'
    | '/instance/$instance/settings/$namespace'
    | '/user/admin/settings/$namespace'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | ''
    | '/user/access'
    | '/user/settings'
    | '/user'
    | '/instance/$instance/accounts'
    | '/instance/$instance/audit-log'
    | '/instance/$instance/discover'
    | '/instance/$instance/meta'
    | '/instance/$instance/proxies'
    | '/instance/$instance/scripts'
    | '/user/admin/console'
    | '/user/admin/scripts'
    | '/user/admin/users'
    | '/instance/$instance'
    | '/user/admin'
    | '/instance/$instance/settings/$namespace'
    | '/user/admin/settings/$namespace'
  id:
    | '__root__'
    | '/'
    | '/_dashboard'
    | '/_dashboard/user'
    | '/_dashboard/instance/$instance'
    | '/_dashboard/user/access'
    | '/_dashboard/user/admin'
    | '/_dashboard/user/settings'
    | '/_dashboard/user/'
    | '/_dashboard/instance/$instance/accounts'
    | '/_dashboard/instance/$instance/audit-log'
    | '/_dashboard/instance/$instance/discover'
    | '/_dashboard/instance/$instance/meta'
    | '/_dashboard/instance/$instance/proxies'
    | '/_dashboard/instance/$instance/scripts'
    | '/_dashboard/user/admin/console'
    | '/_dashboard/user/admin/scripts'
    | '/_dashboard/user/admin/users'
    | '/_dashboard/instance/$instance/'
    | '/_dashboard/user/admin/'
    | '/_dashboard/instance/$instance/settings/$namespace'
    | '/_dashboard/user/admin/settings/$namespace'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  DashboardRoute: typeof DashboardRouteWithChildren
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  DashboardRoute: DashboardRouteWithChildren,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/_dashboard"
      ]
    },
    "/": {
      "filePath": "index.tsx"
    },
    "/_dashboard": {
      "filePath": "_dashboard.tsx",
      "children": [
        "/_dashboard/user",
        "/_dashboard/instance/$instance"
      ]
    },
    "/_dashboard/user": {
      "filePath": "_dashboard/user.tsx",
      "parent": "/_dashboard",
      "children": [
        "/_dashboard/user/access",
        "/_dashboard/user/admin",
        "/_dashboard/user/settings",
        "/_dashboard/user/"
      ]
    },
    "/_dashboard/instance/$instance": {
      "filePath": "_dashboard/instance/$instance.tsx",
      "parent": "/_dashboard",
      "children": [
        "/_dashboard/instance/$instance/accounts",
        "/_dashboard/instance/$instance/audit-log",
        "/_dashboard/instance/$instance/discover",
        "/_dashboard/instance/$instance/meta",
        "/_dashboard/instance/$instance/proxies",
        "/_dashboard/instance/$instance/scripts",
        "/_dashboard/instance/$instance/",
        "/_dashboard/instance/$instance/settings/$namespace"
      ]
    },
    "/_dashboard/user/access": {
      "filePath": "_dashboard/user/access.tsx",
      "parent": "/_dashboard/user"
    },
    "/_dashboard/user/admin": {
      "filePath": "_dashboard/user/admin.tsx",
      "parent": "/_dashboard/user",
      "children": [
        "/_dashboard/user/admin/console",
        "/_dashboard/user/admin/scripts",
        "/_dashboard/user/admin/users",
        "/_dashboard/user/admin/",
        "/_dashboard/user/admin/settings/$namespace"
      ]
    },
    "/_dashboard/user/settings": {
      "filePath": "_dashboard/user/settings.tsx",
      "parent": "/_dashboard/user"
    },
    "/_dashboard/user/": {
      "filePath": "_dashboard/user/index.tsx",
      "parent": "/_dashboard/user"
    },
    "/_dashboard/instance/$instance/accounts": {
      "filePath": "_dashboard/instance/$instance/accounts.tsx",
      "parent": "/_dashboard/instance/$instance"
    },
    "/_dashboard/instance/$instance/audit-log": {
      "filePath": "_dashboard/instance/$instance/audit-log.tsx",
      "parent": "/_dashboard/instance/$instance"
    },
    "/_dashboard/instance/$instance/discover": {
      "filePath": "_dashboard/instance/$instance/discover.tsx",
      "parent": "/_dashboard/instance/$instance"
    },
    "/_dashboard/instance/$instance/meta": {
      "filePath": "_dashboard/instance/$instance/meta.tsx",
      "parent": "/_dashboard/instance/$instance"
    },
    "/_dashboard/instance/$instance/proxies": {
      "filePath": "_dashboard/instance/$instance/proxies.tsx",
      "parent": "/_dashboard/instance/$instance"
    },
    "/_dashboard/instance/$instance/scripts": {
      "filePath": "_dashboard/instance/$instance/scripts.tsx",
      "parent": "/_dashboard/instance/$instance"
    },
    "/_dashboard/user/admin/console": {
      "filePath": "_dashboard/user/admin/console.tsx",
      "parent": "/_dashboard/user/admin"
    },
    "/_dashboard/user/admin/scripts": {
      "filePath": "_dashboard/user/admin/scripts.tsx",
      "parent": "/_dashboard/user/admin"
    },
    "/_dashboard/user/admin/users": {
      "filePath": "_dashboard/user/admin/users.tsx",
      "parent": "/_dashboard/user/admin"
    },
    "/_dashboard/instance/$instance/": {
      "filePath": "_dashboard/instance/$instance/index.tsx",
      "parent": "/_dashboard/instance/$instance"
    },
    "/_dashboard/user/admin/": {
      "filePath": "_dashboard/user/admin/index.tsx",
      "parent": "/_dashboard/user/admin"
    },
    "/_dashboard/instance/$instance/settings/$namespace": {
      "filePath": "_dashboard/instance/$instance/settings/$namespace.tsx",
      "parent": "/_dashboard/instance/$instance"
    },
    "/_dashboard/user/admin/settings/$namespace": {
      "filePath": "_dashboard/user/admin/settings/$namespace.tsx",
      "parent": "/_dashboard/user/admin"
    }
  }
}
ROUTE_MANIFEST_END */
