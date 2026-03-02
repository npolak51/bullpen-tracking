import { useState } from 'react'
import type { PitchType } from '../types/database'
import { useCustomPitchTypes } from '../contexts/CustomPitchTypesContext'
import { useOffline } from '../contexts/OfflineContext'
import { getPitchTypeColor, getPitchTypeLabel } from '../lib/pitchTypes'
import { addCustomPitchType } from '../lib/customPitchTypes'
import { BUILT_IN_TYPES } from '../lib/pitchTypes'

interface PitchTypeSelectorProps {
  value: PitchType
  onChange: (type: PitchType) => void
}

export function PitchTypeSelector({ value, onChange }: PitchTypeSelectorProps) {
  const { customTypes, refresh } = useCustomPitchTypes()
  const offlineCtx = useOffline()
  const online = offlineCtx?.isOnline ?? true
  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [addError, setAddError] = useState('')

  const allTypes: PitchType[] = [...BUILT_IN_TYPES, ...customTypes.map((c) => c.name)]

  async function handleAddCustom() {
    setAddError('')
    const result = await addCustomPitchType(newName)
    if ('error' in result) {
      setAddError(result.error)
      return
    }
    await refresh()
    onChange(result.name)
    setNewName('')
    setShowAddModal(false)
  }

  return (
    <>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {allTypes.map((type) => {
          const color = getPitchTypeColor(type, customTypes)
          const label = getPitchTypeLabel(type, customTypes)
          return (
            <button
              key={type}
              type="button"
              onClick={() => onChange(type)}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: `2px solid ${value === type ? color : '#475569'}`,
                backgroundColor: value === type ? color : 'transparent',
                color: value === type ? 'white' : '#94a3b8',
                fontWeight: value === type ? 600 : 400,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              {label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          disabled={!online}
          title={!online ? 'Add new pitch type requires internet' : undefined}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '2px dashed #475569',
            backgroundColor: 'transparent',
            color: '#94a3b8',
            cursor: online ? 'pointer' : 'not-allowed',
            fontSize: 14,
            opacity: online ? 1 : 0.5,
          }}
        >
          + Add new
        </button>
      </div>

      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowAddModal(false)
            setAddError('')
            setNewName('')
          }}
        >
          <div
            style={{
              backgroundColor: '#1e293b',
              borderRadius: 12,
              padding: 24,
              maxWidth: 320,
              width: '90%',
              border: '1px solid #475569',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ margin: '0 0 12px', fontSize: 16 }}>Add pitch type</h4>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: '#94a3b8' }}>
              Enter a name (e.g. Cutter, Sweeping Slider). A unique color will be
              assigned.
            </p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Pitch type name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddCustom()
                if (e.key === 'Escape') setShowAddModal(false)
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                backgroundColor: '#0f172a',
                border: '1px solid #475569',
                color: 'white',
                fontSize: 16,
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
            />
            {addError && (
              <p style={{ color: '#f87171', fontSize: 14, margin: '0 0 12px' }}>
                {addError}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false)
                  setAddError('')
                  setNewName('')
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: 'transparent',
                  border: '1px solid #475569',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  fontSize: 14,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!newName.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  backgroundColor: newName.trim() ? '#059669' : '#334155',
                  border: 'none',
                  color: 'white',
                  cursor: newName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
