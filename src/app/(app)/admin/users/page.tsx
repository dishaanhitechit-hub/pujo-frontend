'use client'

import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus, UserX, Pencil, X, QrCode, Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { RoleGuard } from '@/lib/auth/role-guard'
import { getUsers, createUser, updateUser, deactivateUser, getUserLoginQr } from '@/lib/api/users'
import { ROLE_LABELS, SELECTABLE_ROLES } from '@/config/roles'
import type { User, Role, ApiError, UpdateUserInput } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth/auth-provider'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

// Regex: 10-digit Indian mobile starting with 6-9
const IN_MOBILE_RE = /^[6-9]\d{9}$/

const phoneRule = z
  .string()
  .regex(IN_MOBILE_RE, 'Enter a valid 10-digit Indian mobile number')

const createSchema = z.object({
  name:       z.string().min(1, 'Name is required'),
  role:       z.enum(SELECTABLE_ROLES as [Role, ...Role[]]),
  phone:      phoneRule,
  whatsappNo: phoneRule.optional().or(z.literal('')),
  email:      z.string().email('Enter a valid email').optional().or(z.literal('')),
  address:    z.string().optional(),
  password:   z.string().min(8, 'Password must be at least 8 characters'),
  canCollect: z.boolean().optional(),
})

type CreateFormData = z.infer<typeof createSchema>

const ALL_EDIT_ROLES: [Role, ...Role[]] = [
  'admin', 'managing_committee', 'core_committee', 'executive', 'cashier', 'collector',
  'committee', 'general',
]

const editSchema = z.object({
  name:       z.string().min(1, 'Name is required'),
  role:       z.enum(ALL_EDIT_ROLES),
  phone:      phoneRule.optional().or(z.literal('')),
  whatsappNo: phoneRule.optional().or(z.literal('')),
  email:      z.string().email('Enter a valid email').optional().or(z.literal('')),
  address:    z.string().optional(),
  password:   z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
  canCollect: z.boolean().optional(),
})

type EditFormData = z.infer<typeof editSchema>

/** Extract the last 10 digits from a stored "+91 XXXXXXXXXX" phone string */
function extractLocalDigits(phone: string | null): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10 ? digits.slice(-10) : digits
}

/** A text input prefixed with a "+91" badge */
function PhoneInput({
  id,
  placeholder,
  error,
  inputProps,
}: {
  id: string
  placeholder?: string
  error?: boolean
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & { name: string }
}) {
  return (
    <div className="flex">
      <span className="inline-flex items-center px-3 h-8 text-sm border border-r-0 border-input rounded-l-lg bg-muted text-muted-foreground select-none shrink-0">
        +91
      </span>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        maxLength={10}
        placeholder={placeholder ?? 'XXXXXXXXXX'}
        className="rounded-l-none"
        aria-invalid={error}
        {...inputProps}
      />
    </div>
  )
}

export default function UsersPage() {
  return (
    <RoleGuard permission="users.manage">
      <UsersContent />
    </RoleGuard>
  )
}

function UsersContent() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deactivating, setDeactivating] = useState<number | null>(null)
  const [pendingDeactivate, setPendingDeactivate] = useState<User | null>(null)
  const [qrUser, setQrUser] = useState<User | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function loadUsers() {
    setLoading(true)
    setError(null)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (err) {
      setError((err as ApiError).message ?? 'Failed to load users.')
    } finally {
      setLoading(false)
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadUsers() }, [])

  async function confirmDeactivate() {
    if (!pendingDeactivate) return
    const u = pendingDeactivate
    setPendingDeactivate(null)
    setDeactivating(u.id)
    try {
      await deactivateUser(u.id)
      toast.success(`${u.name} has been deactivated.`)
      await loadUsers()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to deactivate user.')
    } finally {
      setDeactivating(null)
    }
  }

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Users" subtitle="Manage collector and executive accounts." className="mb-8">
        <Button
          className="bg-brand-orange hover:bg-brand-orange/90 text-white"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="size-4 mr-2" /> Add User
        </Button>
      </PageHeader>

      {error && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive mb-6">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                {['Name', 'Email', 'Role', 'Can Collect', 'Status', 'Phone', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email ?? '—'}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold text-brand-navy">
                      {ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.role === 'admin' ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : u.canCollect ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs font-medium dark:bg-green-900/30 dark:text-green-400">Yes</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">No</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><ActiveBadge isActive={u.isActive} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{u.phone ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQrUser(u)}
                        className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
                        title="Show login QR"
                      >
                        <QrCode className="size-3" />
                        QR
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUser(u)}
                        className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="size-3" />
                        Edit
                      </Button>
                      {u.id !== currentUser?.id && u.isActive && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPendingDeactivate(u)}
                          disabled={deactivating === u.id}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2 gap-1 text-xs"
                        >
                          {deactivating === u.id ? <Loader2 className="size-3 animate-spin" /> : <UserX className="size-3" />}
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">No users found.</div>
          )}
        </div>
      )}

      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={async () => {
            setShowCreateModal(false)
            await loadUsers()
          }}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={async () => {
            setEditingUser(null)
            await loadUsers()
          }}
        />
      )}

      {qrUser && (
        <LoginQrModal user={qrUser} onClose={() => setQrUser(null)} />
      )}

      <ConfirmDialog
        open={!!pendingDeactivate}
        onOpenChange={(o) => { if (!o) setPendingDeactivate(null) }}
        title={`Deactivate ${pendingDeactivate?.name ?? 'user'}?`}
        description="They will no longer be able to sign in. This can be reversed by re-creating their account."
        confirmLabel="Deactivate"
        cancelLabel="Keep active"
        onConfirm={confirmDeactivate}
      />
    </div>
  )
}

function LoginQrModal({ user, onClose }: { user: User; onClose: () => void }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string
    getUserLoginQr(user.id)
      .then((url) => { objectUrl = url; setQrUrl(url) })
      .catch(() => setError('Failed to load QR code'))
      .finally(() => setLoading(false))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [user.id])

  function handleDownload() {
    if (!qrUrl) return
    const a = document.createElement('a')
    a.href = qrUrl
    a.download = `login-qr-${user.name.replace(/\s+/g, '-').toLowerCase()}.png`
    a.click()
  }

  function handlePrint() {
    if (!qrUrl) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <html><body style="display:flex;flex-direction:column;align-items:center;padding:48px;font-family:sans-serif;text-align:center">
        <h2 style="margin:0 0 4px">${user.name}</h2>
        <p style="margin:0 0 24px;color:#666;font-size:14px">${user.email ?? ''}</p>
        <img src="${qrUrl}" style="width:240px;height:240px" />
        <p style="margin-top:20px;color:#999;font-size:12px">PujoPay Login QR — scan with the PujoPay mobile app</p>
      </body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-xs border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-heading font-bold text-base">Login QR Code</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{user.name}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-6 flex flex-col items-center gap-4">
          {loading && (
            <div className="size-[200px] flex items-center justify-center">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {qrUrl && (
            <>
              <img
                src={qrUrl}
                alt="Login QR"
                className="size-[200px] rounded-xl border border-border"
              />
              <div className="text-center">
                <p className="text-sm font-medium">{user.email ?? '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Scan with PujoPay app to auto-fill email
                </p>
              </div>
            </>
          )}
        </div>

        {qrUrl && (
          <div className="flex gap-3 px-5 pb-5">
            <Button variant="outline" className="flex-1 gap-2" onClick={handlePrint}>
              <Printer className="size-4" /> Print
            </Button>
            <Button
              className="flex-1 gap-2 bg-brand-orange hover:bg-brand-orange/90 text-white"
              onClick={handleDownload}
            >
              <Download className="size-4" /> Download
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function RoleSelect({
  id,
  roles,
  selectProps,
}: {
  id: string
  roles: Role[]
  selectProps: React.SelectHTMLAttributes<HTMLSelectElement> & { name: string }
}) {
  return (
    <select
      id={id}
      className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      {...selectProps}
    >
      {roles.map((value) => (
        <option key={value} value={value}>{ROLE_LABELS[value]}</option>
      ))}
    </select>
  )
}

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: 'collector', canCollect: false },
  })

  const watchedRole = useWatch({ control, name: 'role' })

  async function onSubmit(data: CreateFormData) {
    try {
      await createUser({
        name:       data.name,
        role:       data.role,
        phone:      data.phone,
        whatsappNo: data.whatsappNo || null,
        email:      data.email || null,
        address:    data.address || null,
        password:   data.password,
        canCollect: data.canCollect,
      })
      toast.success(`User ${data.name} created successfully.`)
      onSuccess()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to create user.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-heading font-bold text-lg">Add New User</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-name">Full Name <span className="text-destructive">*</span></Label>
            <Input
              id="c-name"
              placeholder="Full name"
              autoFocus
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-role">Role <span className="text-destructive">*</span></Label>
            <RoleSelect id="c-role" roles={SELECTABLE_ROLES} selectProps={register('role')} />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          {/* Can Collect */}
          {watchedRole !== 'admin' && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              {watchedRole === 'collector' ? (
                <>
                  <input type="checkbox" checked readOnly disabled className="size-4 accent-brand-orange" />
                  <div>
                    <p className="text-sm font-medium">Can Collect Payments</p>
                    <p className="text-xs text-muted-foreground">Always enabled for Collection Representatives</p>
                  </div>
                </>
              ) : (
                <>
                  <input
                    id="c-canCollect"
                    type="checkbox"
                    className="size-4 accent-brand-orange"
                    {...register('canCollect')}
                  />
                  <label htmlFor="c-canCollect" className="cursor-pointer">
                    <p className="text-sm font-medium">Can Collect Payments</p>
                    <p className="text-xs text-muted-foreground">Allow this user to initiate collections</p>
                  </label>
                </>
              )}
            </div>
          )}

          {/* Mobile | WhatsApp */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-phone">Mobile <span className="text-destructive">*</span></Label>
              <PhoneInput
                id="c-phone"
                error={!!errors.phone}
                inputProps={register('phone')}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-whatsapp">WhatsApp</Label>
              <PhoneInput
                id="c-whatsapp"
                error={!!errors.whatsappNo}
                inputProps={register('whatsappNo')}
              />
              {errors.whatsappNo && <p className="text-xs text-destructive">{errors.whatsappNo.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-email">Email</Label>
            <Input
              id="c-email"
              type="email"
              placeholder="Optional"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-address">Address</Label>
            <Input id="c-address" placeholder="Optional" {...register('address')} />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-password">Password <span className="text-destructive">*</span></Label>
            <Input
              id="c-password"
              type="password"
              placeholder="Min. 8 characters"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white">
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User
  onClose: () => void
  onSuccess: () => void
}) {
  // Map legacy role values to their modern equivalents for the dropdown
  const resolvedRole = ((): Role => {
    if (user.role === 'committee') return 'core_committee'
    if (user.role === 'general') return 'collector'
    return user.role
  })()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name:       user.name,
      role:       resolvedRole,
      phone:      extractLocalDigits(user.phone),
      whatsappNo: extractLocalDigits(user.whatsappNo),
      email:      user.email ?? '',
      address:    user.address ?? '',
      password:   '',
      canCollect: user.canCollect,
    },
  })

  const watchedRole = useWatch({ control, name: 'role' })

  async function onSubmit(data: EditFormData) {
    const input: UpdateUserInput = {
      name:       data.name,
      role:       data.role,
      phone:      data.phone || null,
      whatsappNo: data.whatsappNo || null,
      email:      data.email || null,
      address:    data.address || null,
      canCollect: data.canCollect,
    }
    if (data.password) input.password = data.password

    try {
      await updateUser(user.id, input)
      toast.success(`${data.name} updated successfully.`)
      onSuccess()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to update user.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="font-heading font-bold text-lg">Edit User</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-name">Full Name <span className="text-destructive">*</span></Label>
            <Input
              id="e-name"
              placeholder="Full name"
              autoFocus
              aria-invalid={!!errors.name}
              {...register('name')}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-role">Role <span className="text-destructive">*</span></Label>
            <RoleSelect id="e-role" roles={SELECTABLE_ROLES} selectProps={register('role')} />
            {errors.role && <p className="text-xs text-destructive">{errors.role.message}</p>}
          </div>

          {/* Can Collect */}
          {watchedRole !== 'admin' && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
              {watchedRole === 'collector' ? (
                <>
                  <input type="checkbox" checked readOnly disabled className="size-4 accent-brand-orange" />
                  <div>
                    <p className="text-sm font-medium">Can Collect Payments</p>
                    <p className="text-xs text-muted-foreground">Always enabled for Collection Representatives</p>
                  </div>
                </>
              ) : (
                <>
                  <input
                    id="e-canCollect"
                    type="checkbox"
                    className="size-4 accent-brand-orange"
                    {...register('canCollect')}
                  />
                  <label htmlFor="e-canCollect" className="cursor-pointer">
                    <p className="text-sm font-medium">Can Collect Payments</p>
                    <p className="text-xs text-muted-foreground">Allow this user to initiate collections</p>
                  </label>
                </>
              )}
            </div>
          )}

          {/* Mobile | WhatsApp */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-phone">Mobile</Label>
              <PhoneInput
                id="e-phone"
                error={!!errors.phone}
                inputProps={register('phone')}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-whatsapp">WhatsApp</Label>
              <PhoneInput
                id="e-whatsapp"
                error={!!errors.whatsappNo}
                inputProps={register('whatsappNo')}
              />
              {errors.whatsappNo && <p className="text-xs text-destructive">{errors.whatsappNo.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-email">Email</Label>
            <Input
              id="e-email"
              type="email"
              placeholder="Optional"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-address">Address</Label>
            <Input id="e-address" placeholder="Optional" {...register('address')} />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-password">
              New Password{' '}
              <span className="text-muted-foreground text-[11px] font-normal">(leave blank to keep current)</span>
            </Label>
            <Input
              id="e-password"
              type="password"
              placeholder="Min. 8 characters"
              aria-invalid={!!errors.password}
              {...register('password')}
            />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white">
              {isSubmitting && <Loader2 className="size-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
