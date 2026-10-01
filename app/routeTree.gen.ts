/* eslint-disable */
// @ts-nocheck
// noinspection JSUnusedGlobalSymbols

import { Route as rootRoute } from './routes/__root'
import { Route as IndexImport } from './routes/index'
import { Route as AdminImport } from './routes/admin'
import { Route as OverlayTop3Import } from './routes/overlay/top3'
import { Route as OverlayCenaImport } from './routes/overlay/cena'

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

const AdminRoute = AdminImport.update({
  id: '/admin',
  path: '/admin',
  getParentRoute: () => rootRoute,
} as any)

const OverlayTop3Route = OverlayTop3Import.update({
  id: '/overlay/top3',
  path: '/overlay/top3',
  getParentRoute: () => rootRoute,
} as any)

const OverlayCenaRoute = OverlayCenaImport.update({
  id: '/overlay/cena',
  path: '/overlay/cena',
  getParentRoute: () => rootRoute,
} as any)

export const routeTree = rootRoute._addFileChildren({
  IndexRoute,
  AdminRoute,
  OverlayTop3Route,
  OverlayCenaRoute,
})

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/admin': typeof AdminRoute
  '/overlay/top3': typeof OverlayTop3Route
  '/overlay/cena': typeof OverlayCenaRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/admin': typeof AdminRoute
  '/overlay/top3': typeof OverlayTop3Route
  '/overlay/cena': typeof OverlayCenaRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexRoute
  '/admin': typeof AdminRoute
  '/overlay/top3': typeof OverlayTop3Route
  '/overlay/cena': typeof OverlayCenaRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/admin' | '/overlay/top3' | '/overlay/cena'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/admin' | '/overlay/top3' | '/overlay/cena'
  id: '__root__' | '/' | '/admin' | '/overlay/top3' | '/overlay/cena'
  fileRoutesById: FileRouteTypes
}
