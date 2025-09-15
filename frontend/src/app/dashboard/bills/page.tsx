'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Search, 
  DollarSign,
  User,
  Building2,
  Receipt,
  CreditCard,
  Percent,
  Eye,
  FileText,
  CheckCircle,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface BillItem {
  _id: string;
  type: 'room_charge' | 'food_order' | 'service_charge' | 'tax' | 'discount' | 'other';
  description: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  date: string;
  orderId?: string;
  addedBy?: string;
  notes?: string;
}

interface Payment {
  _id: string;
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  reference?: string;
  date: string;
  receivedBy: string;
  notes?: string;
}

interface Bill {
  _id: string;
  billNumber: string;
  guest: {
    _id: string;
    name: string;
    phone: string;
    email?: string;
  };
  room: {
    _id: string;
    number: string;
    type?: string;
    floor?: number;
  };
  checkInDate: string;
  checkOutDate?: string;
  items: BillItem[];
  payments: Payment[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: 'active' | 'paid' | 'partially_paid' | 'cancelled' | 'finalized';
  finalizedAt?: string;
  finalizedBy?: string;
  isGuestCheckedOut?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Guest {
  _id: string;
  name: string;
  phone: string;
  roomNumber: string;
}

interface AddItemForm {
  type: 'room_charge' | 'food_order' | 'service_charge' | 'tax' | 'other';
  description: string;
  amount: number;
  quantity: number;
}

interface AddPaymentForm {
  amount: number;
  method: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'other';
  reference: string;
  notes: string;
}

const statusColors = {
  active: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  partially_paid: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  finalized: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

const statusLabels = {
  active: 'Active',
  paid: 'Paid',
  partially_paid: 'Partially Paid',
  cancelled: 'Cancelled',
  finalized: 'Finalized'
};

const itemTypeLabels = {
  room_charge: 'Room Charge',
  food_order: 'Food Order',
  service_charge: 'Service Charge',
  tax: 'Tax',
  other: 'Other'
};

const paymentMethodLabels = {
  cash: 'Cash',
  card: 'Card',
  upi: 'UPI',
  bank_transfer: 'Bank Transfer',
  other: 'Other'
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOutstanding: 0,
    active: { count: 0, totalAmount: 0, totalPaid: 0 },
    paid: { count: 0, totalAmount: 0, totalPaid: 0 },
    partially_paid: { count: 0, totalAmount: 0, totalPaid: 0 },
    finalized: { count: 0, totalAmount: 0, totalPaid: 0 }
  });

  const [addItemForm, setAddItemForm] = useState<AddItemForm>({
    type: 'other',
    description: '',
    amount: 0,
    quantity: 1
  });

  const [addPaymentForm, setAddPaymentForm] = useState<AddPaymentForm>({
    amount: 0,
    method: 'cash',
    reference: '',
    notes: ''
  });

  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);

  useEffect(() => {
    fetchBills();
    fetchGuests();
    fetchStats();
  }, []);

  const fetchBills = async () => {
    try {
      console.log('🔍 Fetching bills...');
      // Get active bills by default
      const response = await apiClient.get('/bills?type=active');
      console.log('📊 Bills API response:', response);
      console.log('📋 Bills data:', response.data.data);
      setBills(response.data.data);
      console.log('✅ Bills state updated with:', response.data.data);
    } catch (error) {
      console.error('❌ Error fetching bills:', error);
      toast.error('Failed to fetch bills');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBillsByType = async (type: string) => {
    try {
      setIsLoading(true);
      let endpoint = '/bills';
      if (type !== 'all') {
        endpoint += `?type=${type}`;
      }
      const response = await apiClient.get(endpoint);
      setBills(response.data.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to fetch bills');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGuests = async () => {
    try {
      const response = await apiClient.get('/guests');
      setGuests(response.data.data);
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('🔍 Fetching bill stats...');
      const response = await apiClient.get('/bills/summary');
      console.log('📊 Stats API response:', response);
      const data = response.data.data;
      console.log('📋 Stats data:', data);
      
      // Update stats with the new backend structure
      setStats({
        totalRevenue: data.totalRevenue || 0,
        totalOutstanding: data.totalOutstanding || 0,
        active: data.active || { count: 0, totalAmount: 0, totalPaid: 0 },
        paid: data.paid || { count: 0, totalAmount: 0, totalPaid: 0 },
        partially_paid: data.partially_paid || { count: 0, totalAmount: 0, totalPaid: 0 },
        finalized: data.finalized || { count: 0, totalAmount: 0, totalPaid: 0 }
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedBill) return;
    
    try {
      setIsLoading(true);
      await apiClient.post(`/bills/${selectedBill._id}/charges`, {
        ...addItemForm,
        addedBy: 'Manager' // This should come from user context
      });
      toast.success('Item added to bill successfully!');
      setIsAddItemDialogOpen(false);
      resetAddItemForm();
      fetchBills();
      fetchStats();
      // Refresh selected bill
      const updatedBill = bills.find(b => b._id === selectedBill._id);
      if (updatedBill) setSelectedBill(updatedBill);
    } catch (error: any) {
      console.error('Error adding item to bill:', error);
      toast.error(error.response?.data?.message || 'Failed to add item to bill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (!selectedBill) return;
    
    try {
      setIsLoading(true);
      await apiClient.post(`/bills/${selectedBill._id}/payments`, {
        ...addPaymentForm,
        receivedBy: 'Manager' // This should come from user context
      });
      toast.success('Payment added successfully!');
      setIsAddPaymentDialogOpen(false);
      resetAddPaymentForm();
      fetchBills();
      fetchStats();
      // Refresh selected bill
      const updatedBill = bills.find(b => b._id === selectedBill._id);
      if (updatedBill) setSelectedBill(updatedBill);
    } catch (error: any) {
      console.error('Error adding payment:', error);
      toast.error(error.response?.data?.message || 'Failed to add payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyDiscount = async () => {
    if (!selectedBill) return;
    
    try {
      setIsLoading(true);
      await apiClient.post(`/bills/${selectedBill._id}/charges`, {
        type: 'discount',
        description: 'Manager Discount',
        amount: -Math.abs(discountAmount), // Negative amount for discount
        quantity: 1,
        addedBy: 'Manager'
      });
      toast.success('Discount applied successfully!');
      setDiscountAmount(0);
      fetchBills();
      fetchStats();
      // Refresh selected bill
      const updatedBill = bills.find(b => b._id === selectedBill._id);
      if (updatedBill) setSelectedBill(updatedBill);
    } catch (error: any) {
      console.error('Error applying discount:', error);
      toast.error(error.response?.data?.message || 'Failed to apply discount');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTax = async () => {
    if (!selectedBill) return;
    
    try {
      setIsLoading(true);
      // Calculate tax amount based on current subtotal
        const taxAmountValue = (selectedBill.subtotal * taxAmount) / 100;
      await apiClient.post(`/bills/${selectedBill._id}/charges`, {
        type: 'tax',
        description: `Service Tax (${taxAmount}%)`,
        amount: taxAmountValue,
        quantity: 1,
        addedBy: 'Manager'
      });
      toast.success('Tax applied successfully!');
      setTaxAmount(0);
      fetchBills();
      fetchStats();
      // Refresh selected bill
      const updatedBill = bills.find(b => b._id === selectedBill._id);
      if (updatedBill) setSelectedBill(updatedBill);
    } catch (error: any) {
      console.error('Error applying tax:', error);
      toast.error(error.response?.data?.message || 'Failed to apply tax');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeBill = async (billId: string) => {
    try {
      setIsLoading(true);
      await apiClient.put(`/bills/${billId}/finalize`, {
        finalizedBy: 'Manager' // This should come from user context
      });
      toast.success('Bill finalized successfully!');
      fetchBills();
      fetchStats();
    } catch (error: any) {
      console.error('Error finalizing bill:', error);
      toast.error(error.response?.data?.message || 'Failed to finalize bill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestCheckout = async (guestId: string) => {
    try {
      setIsLoading(true);
      await apiClient.put(`/guests/${guestId}/checkout`);
      toast.success('Guest checked out successfully!');
      fetchBills();
      fetchStats();
    } catch (error: any) {
      console.error('Error checking out guest:', error);
      toast.error(error.response?.data?.message || 'Failed to checkout guest');
    } finally {
      setIsLoading(false);
    }
  };

  const viewGuestHistory = () => {
    // Navigate to guest history page
    window.location.href = '/dashboard/guest-history';
  };

  const handleStatusChange = async (billId: string, newStatus: string) => {
    try {
      setIsLoading(true);
      await apiClient.put(`/bills/${billId}`, { status: newStatus });
      toast.success('Bill status updated successfully!');
      fetchBillsByType(statusFilter);
      fetchStats();
    } catch (error: any) {
      console.error('Error updating bill status:', error);
      toast.error(error.response?.data?.message || 'Failed to update bill status');
    } finally {
      setIsLoading(false);
    }
  };

  const resetAddItemForm = () => {
    setAddItemForm({
      type: 'other',
      description: '',
      amount: 0,
      quantity: 1
    });
  };

  const resetAddPaymentForm = () => {
    setAddPaymentForm({
      amount: 0,
      method: 'cash',
      reference: '',
      notes: ''
    });
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bill.room.number.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  console.log('🔍 Bills filtering:', {
    totalBills: bills.length,
    searchTerm,
    statusFilter,
    filteredBills: filteredBills.length
  });

  const getStatusBadge = (status: string) => {
    return (
      <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">₹{stats.totalRevenue}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">Outstanding Amount</CardTitle>
            <Receipt className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">₹{stats.totalOutstanding}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">Active Bills</CardTitle>
            <CheckCircle className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">{stats.active?.count || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">Paid Bills</CardTitle>
            <CreditCard className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">{stats.paid?.count || 0}</div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-black dark:text-white">Finalized Bills</CardTitle>
            <FileText className="h-4 w-4 text-black dark:text-white opacity-70" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-medium text-black dark:text-white">{stats.finalized?.count || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-black dark:text-white opacity-70" />
            <Input
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            fetchBillsByType(value);
          }}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
              <SelectItem value="all" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">All Status</SelectItem>
              <SelectItem value="active" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Active</SelectItem>
              <SelectItem value="paid" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Paid</SelectItem>
              <SelectItem value="partially_paid" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Partially Paid</SelectItem>
              <SelectItem value="finalized" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Finalized</SelectItem>
              <SelectItem value="cancelled" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              fetchBillsByType(statusFilter);
              fetchStats();
            }}
            disabled={isLoading}
            className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          {statusFilter === 'finalized' && (
            <Button
              variant="outline"
              onClick={viewGuestHistory}
              className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
            >
              <User className="h-4 w-4 mr-1" />
              View Guest History
            </Button>
          )}
        </div>
      </div>

      {/* Current Filter Summary */}
      {statusFilter !== 'all' && (
        <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-black dark:text-white">
                  {statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bills Summary
                </h3>
                <p className="text-sm text-black dark:text-white opacity-70">
                  {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''} found
                </p>
              </div>
              <div className="text-right">
                <div className="text-xl font-medium text-black dark:text-white">
                  ₹{filteredBills.reduce((sum, bill) => sum + bill.totalAmount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-black dark:text-white opacity-70">Total Amount</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bills List */}
      <Card className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-black dark:text-white">Bill Management</CardTitle>
            <div className="text-sm text-black dark:text-white opacity-70">
              {statusFilter === 'all' ? 'All Bills' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Bills`} • 
              {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-sm animate-pulse">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-sm w-32 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-sm w-48 mb-1"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-sm w-64"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-sm w-16"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-sm w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="mx-auto h-12 w-12 text-black dark:text-white opacity-70 mb-4" />
                <h3 className="text-lg font-medium mb-2 text-black dark:text-white">No Bills Found</h3>
                <p className="text-black dark:text-white opacity-70">
                  No bills found matching your criteria.
                </p>
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div key={bill._id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-800 rounded-sm bg-white dark:bg-black">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-black dark:text-white">#{bill.billNumber}</h3>
                        {getStatusBadge(bill.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-black dark:text-white opacity-70">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {bill.guest.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          Room {bill.room.number}
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          Total: ₹{bill.totalAmount}
                        </div>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          Balance: ₹{bill.balanceAmount}
                        </div>
                        {bill.isGuestCheckedOut && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Checked Out
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-black dark:text-white opacity-70 mt-1">
                        {bill.items.length} item{bill.items.length > 1 ? 's' : ''} • 
                        Created {formatDistanceToNow(new Date(bill.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBill(bill);
                        setIsViewDialogOpen(true);
                      }}
                      className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {bill.status === 'active' && !bill.isGuestCheckedOut && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleFinalizeBill(bill._id)}
                        className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm"
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Finalize
                      </Button>
                    )}
                    {bill.status === 'active' && !bill.isGuestCheckedOut && bill.balanceAmount <= 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleGuestCheckout(bill.guest._id)}
                        className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Checkout Guest
                      </Button>
                    )}
                    {bill.status === 'active' && (
                      <Select value={bill.status} onValueChange={(value) => handleStatusChange(bill._id, value)}>
                        <SelectTrigger className="w-[140px] bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                          <SelectItem value="active" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Active</SelectItem>
                          <SelectItem value="cancelled" className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bill Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
          <DialogHeader>
            <DialogTitle className="text-black dark:text-white">Bill Details</DialogTitle>
            <DialogDescription className="text-black dark:text-white opacity-70">
              View and manage bill details, add items, payments, and apply discounts.
            </DialogDescription>
          </DialogHeader>
          {selectedBill && (
            <div className="space-y-6">
              {/* Bill Header */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">Bill Number</Label>
                  <p className="text-sm text-black dark:text-white opacity-70">#{selectedBill.billNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedBill.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">Guest</Label>
                  <p className="text-sm text-black dark:text-white opacity-70">{selectedBill.guest.name} - Room {selectedBill.room.number}</p>
                </div>
              </div>
              
              {/* Additional Bill Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-black dark:text-white">Check-in Date</Label>
                  <p className="text-sm text-black dark:text-white opacity-70">{new Date(selectedBill.checkInDate).toLocaleDateString()}</p>
                </div>
                {selectedBill.checkOutDate && (
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white">Check-out Date</Label>
                    <p className="text-sm text-black dark:text-white opacity-70">{new Date(selectedBill.checkOutDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
              
              {selectedBill.finalizedAt && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white">Finalized At</Label>
                    <p className="text-sm text-black dark:text-white opacity-70">{new Date(selectedBill.finalizedAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-black dark:text-white">Finalized By</Label>
                    <p className="text-sm text-black dark:text-white opacity-70">{selectedBill.finalizedBy || 'System'}</p>
                  </div>
                </div>
              )}

              {/* Bill Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-black dark:text-white">Bill Items</Label>
                  {selectedBill.status === 'active' && (
                    <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
                        <DialogHeader>
                          <DialogTitle className="text-black dark:text-white">Add Bill Item</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label className="text-black dark:text-white">Item Type</Label>
                            <Select value={addItemForm.type} onValueChange={(value: any) => setAddItemForm({...addItemForm, type: value})}>
                              <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                                {Object.entries(itemTypeLabels).map(([value, label]) => (
                                  <SelectItem key={value} value={value} className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">{label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-black dark:text-white">Description</Label>
                            <Input
                              value={addItemForm.description}
                              onChange={(e) => setAddItemForm({...addItemForm, description: e.target.value})}
                              placeholder="Item description"
                              className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-black dark:text-white">Amount (₹)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={addItemForm.amount}
                                onChange={(e) => setAddItemForm({...addItemForm, amount: parseFloat(e.target.value) || 0})}
                                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-black dark:text-white">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={addItemForm.quantity}
                                onChange={(e) => setAddItemForm({...addItemForm, quantity: parseInt(e.target.value) || 1})}
                                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddItemDialogOpen(false)} className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm">Cancel</Button>
                          <Button onClick={handleAddItem} className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm">Add Item</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedBill.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-sm">
                      <div>
                        <span className="font-medium text-black dark:text-white">{itemTypeLabels[item.type as keyof typeof itemTypeLabels]}</span>
                        <p className="text-sm text-black dark:text-white opacity-70">{item.description}</p>
                        {item.quantity && item.quantity > 1 && (
                          <p className="text-xs text-black dark:text-white opacity-70">Qty: {item.quantity}</p>
                        )}
                      </div>
                      <span className="font-medium text-black dark:text-white">₹{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-black dark:text-white">Payments</Label>
                  {selectedBill.status !== 'paid' && (
                    <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-sm">
                        <DialogHeader>
                          <DialogTitle className="text-black dark:text-white">Add Payment</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-black dark:text-white">Amount (₹)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={addPaymentForm.amount}
                                onChange={(e) => setAddPaymentForm({...addPaymentForm, amount: parseFloat(e.target.value) || 0})}
                                className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-black dark:text-white">Payment Method</Label>
                              <Select value={addPaymentForm.method} onValueChange={(value: any) => setAddPaymentForm({...addPaymentForm, method: value})}>
                                <SelectTrigger className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 rounded-sm">
                                  {Object.entries(paymentMethodLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value} className="text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900">{label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-black dark:text-white">Reference</Label>
                            <Input
                              value={addPaymentForm.reference}
                              onChange={(e) => setAddPaymentForm({...addPaymentForm, reference: e.target.value})}
                              placeholder="Transaction reference (optional)"
                              className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-black dark:text-white">Notes</Label>
                            <Textarea
                              value={addPaymentForm.notes}
                              onChange={(e) => setAddPaymentForm({...addPaymentForm, notes: e.target.value})}
                              placeholder="Payment notes (optional)"
                              className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setIsAddPaymentDialogOpen(false)} className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm">Cancel</Button>
                          <Button onClick={handleAddPayment} className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-sm">Add Payment</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedBill.payments.length === 0 ? (
                    <p className="text-sm text-black dark:text-white opacity-70">No payments recorded</p>
                  ) : (
                    selectedBill.payments.map((payment, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-sm">
                        <div>
                          <span className="font-medium text-black dark:text-white">{paymentMethodLabels[payment.method as keyof typeof paymentMethodLabels]}</span>
                          {payment.reference && (
                            <p className="text-sm text-black dark:text-white opacity-70">Ref: {payment.reference}</p>
                          )}
                          <p className="text-xs text-black dark:text-white opacity-70">
                            {new Date(payment.date).toLocaleString()}
                          </p>
                        </div>
                        <span className="font-medium text-black dark:text-white">₹{payment.amount}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Discount and Tax Controls */}
              {selectedBill.status === 'active' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-black dark:text-white">Apply Discount</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                        placeholder="Discount amount"
                        className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                      />
                      <Button variant="outline" onClick={handleApplyDiscount} className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm">
                        <Percent className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black dark:text-white">Apply Tax</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={taxAmount}
                        onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                        placeholder="Tax percentage"
                        className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white rounded-sm"
                      />
                      <Button variant="outline" onClick={handleApplyTax} className="bg-white dark:bg-black border-gray-200 dark:border-gray-800 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 rounded-sm">
                        <Calculator className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Bill Summary */}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-black dark:text-white">
                    <span>Subtotal:</span>
                    <span>₹{selectedBill.subtotal}</span>
                  </div>
                  {selectedBill.discountAmount > 0 && (
                    <div className="flex justify-between text-black dark:text-white">
                      <span>Discount:</span>
                      <span>-₹{Math.abs(selectedBill.discountAmount)}</span>
                    </div>
                  )}
                  {selectedBill.taxAmount > 0 && (
                    <div className="flex justify-between text-black dark:text-white">
                      <span>Tax:</span>
                      <span>₹{selectedBill.taxAmount}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium text-lg border-t border-gray-200 dark:border-gray-800 pt-2 text-black dark:text-white">
                    <span>Total:</span>
                    <span>₹{selectedBill.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-black dark:text-white">
                    <span>Paid Amount:</span>
                    <span>₹{selectedBill.paidAmount}</span>
                  </div>
                  <div className="flex justify-between font-medium text-black dark:text-white">
                    <span>Balance:</span>
                    <span>
                      ₹{selectedBill.balanceAmount}
                    </span>
                  </div>
                  {selectedBill.isGuestCheckedOut && (
                    <div className="flex justify-between text-sm text-black dark:text-white opacity-70">
                      <span>Guest Status:</span>
                      <span>Checked Out</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
