'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Plus, UserX, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { PageHeader } from '@/components/dashboard/PageHeader'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import { RoleGuard } from '@/lib/auth/role-guard'
import { getUsers, createUser, updateUser, deactivateUser } from '@/lib/api/users'
import { ROLE_LABELS } from '@/config/roles'
import type { User, Role, ApiError, UpdateUserInput } from '@/types'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/lib/auth/auth-provider'

const createSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  whatsappNo: z.string().optional(),
  role: z.enum(['admin', 'executive', 'committee', 'general']),
})

type CreateFormData = z.infer<typeof createSchema>

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
  const [error, setError] = useState<string | null>(null)

  async function loadUsers() {
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

  async function handleDeactivate(u: User) {
    if (!confirm(`Deactivate ${u.name}? They will no longer be able to sign in.`)) return
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
                {['Name', 'Email', 'Role', 'Status', 'Phone', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-3 font-medium text-foreground">{u.name}</td>
                  <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold text-brand-navy capitalize">{ROLE_LABELS[u.role]}</span>
                  </td>
                  <td className="px-5 py-3"><ActiveBadge isActive={u.isActive} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{u.phone ?? '—'}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
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
                          onClick={() => handleDeactivate(u)}
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
    </div>
  )
}

const editSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  whatsappNo: z.string().optional(),
  upiId: z.string().optional(),
  role: z.enum(['admin', 'executive', 'committee', 'general']),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
})

type EditFormData = z.infer<typeof editSchema>

function EditUserModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User
  onClose: () => void
  onSuccess: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? '',
      whatsappNo: user.whatsappNo ?? '',
      upiId: user.upiId ?? '',
      role: user.role,
      password: '',
    },
  })

  async function onSubmit(data: EditFormData) {
    const input: UpdateUserInput = {
      name: data.name,
      phone: data.phone || null,
      whatsappNo: data.whatsappNo || null,
      upiId: data.upiId || null,
      role: data.role,
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
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-bold text-lg">Edit User</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="e-name" placeholder="Full name" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-phone">Phone</Label>
              <Input id="e-phone" type="tel" placeholder="Optional" {...register('phone')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="e-whatsapp">WhatsApp</Label>
              <Input id="e-whatsapp" type="tel" placeholder="Optional" {...register('whatsappNo')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-upi">UPI ID</Label>
            <Input id="e-upi" placeholder="Optional" {...register('upiId')} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-role">Role <span className="text-destructive">*</span></Label>
            <select
              id="e-role"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...register('role')}
            >
              {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="e-password">New Password <span className="text-muted-foreground text-[11px] font-normal">(leave blank to keep current)</span></Label>
            <Input id="e-password" type="password" placeholder="Min. 8 characters" aria-invalid={!!errors.password} {...register('password')} />
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

function CreateUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormData>({ resolver: zodResolver(createSchema) })

  async function onSubmit(data: CreateFormData) {
    try {
      await createUser({
        ...data,
        phone: data.phone || null,
        whatsappNo: data.whatsappNo || null,
        upiId: null,
      })
      toast.success(`User ${data.name} created successfully.`)
      onSuccess()
    } catch (err) {
      toast.error((err as ApiError).message ?? 'Failed to create user.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-heading font-bold text-lg">Add New User</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close">
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-name">Full Name <span className="text-destructive">*</span></Label>
            <Input id="c-name" placeholder="Full name" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-email">Email <span className="text-destructive">*</span></Label>
            <Input id="c-email" type="email" placeholder="email@example.com" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-password">Password <span className="text-destructive">*</span></Label>
            <Input id="c-password" type="password" placeholder="Min. 8 characters" aria-invalid={!!errors.password} {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" type="tel" placeholder="Optional" {...register('phone')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="c-whatsapp">WhatsApp</Label>
              <Input id="c-whatsapp" type="tel" placeholder="Optional" {...register('whatsappNo')} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="c-role">Role <span className="text-destructive">*</span></Label>
            <select
              id="c-role"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue="committee"
              {...register('role')}
            >
              {(Object.entries(ROLE_LABELS) as [Role, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
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
