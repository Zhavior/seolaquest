'use client'

import React from 'react'
import { ProfileHeader } from '@/features/profile/components/ProfileHeader'
import { ProfileQuestBoard } from '@/features/profile/components/ProfileQuestBoard'
import { ProfileCodex } from '@/features/profile/components/ProfileCodex'
import { ProfileInventory } from '@/features/profile/components/ProfileInventory'
import { ProfileBounties } from '@/features/profile/components/ProfileBounties'
import { useProfileState, CATEGORY_TAGS, CARD_COLORS } from '@/features/profile/hooks/useProfileState'
import { ProfilePost } from '@/features/profile/types'

export default function ProfileClient({ 
  user, 
  initialPosts 
}: { 
  user: { name: string; title: string; level: number }; 
  initialPosts: ProfilePost[] 
}) {
  const state = useProfileState(initialPosts)
  const initials = (user.name || 'Hunter').slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen max-w-7xl mx-auto p-4 md:p-8 text-ink font-mono select-none space-y-8">
      {/* ------------------ HERO BANNER / HUD ------------------ */}
      <ProfileHeader user={user} initials={initials} />

      {/* ------------------ HQ GRID SYSTEM ------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE QUEST BOARD & DEADLINES (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <ProfileQuestBoard 
            quests={state.quests}
            newQuestTitle={state.newQuestTitle}
            setNewQuestTitle={state.setNewQuestTitle}
            addQuest={state.addQuest}
            toggleQuest={state.toggleQuest}
          />

          <ProfileCodex 
            posts={state.posts}
            content={state.content}
            setContent={state.setContent}
            selectedTag={state.selectedTag}
            setSelectedTag={state.setSelectedTag}
            notice={state.notice}
            slashedPosts={state.slashedPosts}
            pinnedPosts={state.pinnedPosts}
            commentsMap={state.commentsMap}
            commentInputs={state.commentInputs}
            setCommentInputs={state.setCommentInputs}
            openCommentBoxes={state.openCommentBoxes}
            user={user}
            getSlashCount={state.getSlashCount}
            handleSlash={state.handleSlash}
            handleTogglePin={state.handleTogglePin}
            handleToggleCommentBox={state.handleToggleCommentBox}
            handleAddComment={state.handleAddComment}
            createPost={state.createPost}
            deletePost={state.deletePost}
            pending={state.pending}
            parsePostContent={state.parsePostContent}
            CARD_COLORS={CARD_COLORS}
            CATEGORY_TAGS={CATEGORY_TAGS}
          />
        </div>

        {/* RIGHT COLUMN: HUNTER STASH & BOUNTIES (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <ProfileInventory inventorySlots={state.inventorySlots} />
          <ProfileBounties />
        </div>

      </div>
    </div>
  )
}
