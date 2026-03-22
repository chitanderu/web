'use client'

import type { RouteObject } from 'react-router-dom'
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from 'react-router-dom'

import { NotFound404 } from '~/components/common/404'
import { LayoutHeader } from '~/components/layout/dashboard/Header'
import { ComposedKBarProvider } from '~/components/layout/dashboard/Kbar'

import { DashboardLayoutContext } from '../../../../components/modules/dashboard/utils/context'
import type { DashboardRouteConfig } from '../../../../components/modules/dashboard/utils/helper'
import {
  Component as CommentsIndex,
  config as commentsIndexConfig,
} from '../../../../routes/comments/index'
import {
  Component as CommentsLayout,
  config as commentsLayoutConfig,
} from '../../../../routes/comments/layout'
import {
  Component as DashboardHome,
  config as dashboardHomeConfig,
} from '../../../../routes/index'
import {
  Component as NotesEdit,
  config as notesEditConfig,
} from '../../../../routes/notes/edit/index'
import {
  Component as NotesLayout,
  config as notesLayoutConfig,
} from '../../../../routes/notes/layout'
import {
  Component as NotesList,
  config as notesListConfig,
} from '../../../../routes/notes/list/index'
import {
  Component as NotesTopics,
  config as notesTopicsConfig,
} from '../../../../routes/notes/topics/index'
import { Component as PasskeyIndex } from '../../../../routes/passkey/index'
import {
  Component as PasskeyLayout,
  config as passkeyLayoutConfig,
} from '../../../../routes/passkey/layout'
import {
  Component as PostsCategory,
  config as postsCategoryConfig,
} from '../../../../routes/posts/category/index'
import {
  Component as PostsEdit,
  config as postsEditConfig,
} from '../../../../routes/posts/edit/index'
import {
  Component as PostsLayout,
  config as postsLayoutConfig,
} from '../../../../routes/posts/layout'
import {
  Component as PostsList,
  config as postsListConfig,
} from '../../../../routes/posts/list/index'
import {
  Component as SaysIndex,
  config as saysConfig,
} from '../../../../routes/says/index'
import {
  Component as VueIndex,
  config as vueConfig,
} from '../../../../routes/vue/index'

export interface RouteItem {
  children?: RouteItem[]
  config: DashboardRouteConfig
  path: string
}

const sortRouteItems = (items: RouteItem[]): RouteItem[] => {
  // Do NOT use structuredClone here: route configs contain React elements (e.g. icon),
  // which are not cloneable and will throw DataCloneError in the browser.
  const normalize = (arr: RouteItem[]): RouteItem[] => {
    return arr
      .map((r) => ({
        ...r,
        children: r.children ? normalize(r.children) : undefined,
      }))
      .sort((a, b) => a.config.priority - b.config.priority)
  }

  return normalize(items)
}

const nestedRouteMap: RouteItem[] = sortRouteItems([
  {
    path: '/',
    config: dashboardHomeConfig,
  },
  {
    path: '/posts',
    config: postsLayoutConfig,
    children: [
      { path: '/posts/list', config: postsListConfig },
      { path: '/posts/edit', config: postsEditConfig },
      { path: '/posts/category', config: postsCategoryConfig },
    ],
  },
  {
    path: '/notes',
    config: notesLayoutConfig,
    children: [
      { path: '/notes/list', config: notesListConfig },
      { path: '/notes/edit', config: notesEditConfig },
      { path: '/notes/series', config: notesTopicsConfig },
    ],
  },
  {
    path: '/comments',
    config: commentsLayoutConfig ?? commentsIndexConfig,
  },
  {
    path: '/says',
    config: saysConfig,
  },
  {
    path: '/passkey',
    config: passkeyLayoutConfig,
  },
  {
    path: '/vue',
    config: vueConfig,
  },
])

const routeConfig: RouteObject[] = [
  {
    path: '/dashboard',
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHome /> },

      {
        path: 'posts',
        element: <PostsLayout />,
        children: [
          {
            index: true,
            element: (
              <Navigate
                replace
                to={`/dashboard${postsLayoutConfig.redirect || '/posts/list'}`}
              />
            ),
          },
          { path: 'list', element: <PostsList /> },
          { path: 'edit', element: <PostsEdit /> },
          { path: 'category', element: <PostsCategory /> },
        ],
      },

      {
        path: 'notes',
        element: <NotesLayout />,
        children: [
          {
            index: true,
            element: (
              <Navigate
                replace
                to={`/dashboard${notesLayoutConfig.redirect || '/notes/list'}`}
              />
            ),
          },
          { path: 'list', element: <NotesList /> },
          { path: 'edit', element: <NotesEdit /> },
          { path: 'series', element: <NotesTopics /> },
        ],
      },

      {
        path: 'comments',
        element: <CommentsLayout />,
        children: [{ index: true, element: <CommentsIndex /> }],
      },

      { path: 'says', element: <SaysIndex /> },
      {
        path: 'passkey',
        element: <PasskeyLayout />,
        children: [{ index: true, element: <PasskeyIndex /> }],
      },

      { path: 'vue', element: <VueIndex /> },
    ],
  },
  { path: '*', element: <NotFound404 /> },
]

const router = createBrowserRouter(routeConfig)

export const ClientRouter = () => {
  return <RouterProvider router={router} />
}

function DashboardLayout() {
  return (
    <div className="flex size-full grow flex-col">
      <DashboardLayoutContext value={nestedRouteMap}>
        <ComposedKBarProvider>
          <LayoutHeader />
          <Outlet />
        </ComposedKBarProvider>
      </DashboardLayoutContext>
    </div>
  )
}
