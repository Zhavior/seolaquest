'use client'

import type { ReactNode } from 'react'

import ShellLayout from './layout/ShellLayout'
import Sidebar from './sidebar/Sidebar'
import StatusBar from './statusbar/StatusBar'
import Workspace from './workspace/Workspace'

interface Props {
  children: ReactNode
}

export default function CoQuestShell({
  children,
}: Props) {
  return (
    <ShellLayout
      sidebar={<Sidebar />}
      statusBar={<StatusBar />}
    >
      <Workspace>
        {children}
      </Workspace>
    </ShellLayout>
  )
}
