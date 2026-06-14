
import { supabase } from './supabaseClient';
import type { User, MenuItem, Order, SalesSummary, Feedback, Offer, StudentProfile, Reward, StudentPoints, TodaysDashboardStats, TodaysDetailedReport, AdminStats, OwnerBankDetails, CanteenPhoto, CartItem, AvailabilityResult, CommissionRecord, CombinedGroup } from '../types';
import { OrderStatus as OrderStatusEnum, Role } from '../types';

const getErrorMessage = (error: any): string => {
    if (!error) return 'Unknown error';
    if (typeof error === 'string') return error;
    return error.message || error.details || JSON.stringify(error);
};

const normalizeCategory = (cat?: string): 'food' | 'game' => {
    const c = (cat || 'food').toLowerCase();
    if (c === 'screen' || c === 'game') return 'game';
    return 'food';
};

// --- MAPPING HELPERS ---

const mapMenuItem = (item: any): MenuItem => ({
    ...item,
    imageUrl: item.image_url,
    isAvailable: item.is_available ?? true,
    isCombo: item.is_combo,
    comboItems: item.combo_items,
    slotIds: item.slot_ids,
    durationMinutes: item.duration_minutes,
    averageRating: Number(item.average_rating) || 0,
    favoriteCount: item.favorite_count || 0,
    category: normalizeCategory(item.category)
});

const mapOrder = (o: any): Order => ({
    ...o,
    id: o.id,
    studentId: o.student_id,
    studentName: o.student_name,
    customerPhone: o.customer_phone,
    seatNumber: o.seat_number,
    totalAmount: Number(o.total_amount || 0),
    qrToken: o.qr_token,
    status: o.status as OrderStatusEnum,
    timestamp: new Date(o.timestamp || o.created_at),
    collectedAt: o.collected_at,
    orderType: 'real',
    items: (o.order_items || []).map((oi: any) => ({
        id: oi.menu_item_id,
        name: oi.name,
        quantity: Number(oi.quantity || 0),
        price: Number(oi.price || 0),
        notes: oi.notes,
        imageUrl: oi.image_url || 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=300',
        category: normalizeCategory(oi.category),
        selectedSlotId: oi.selected_slot_id,
        selectedStartTime: oi.selected_start_time,
        durationMinutes: oi.duration_minutes,
        isDelivered: oi.is_delivered ?? false,
        delivered_quantity: oi.delivered_quantity ?? 0
    }))
});

// --- ORDER OPERATIONS ---

export const getSalesByDate = async (dateStr: string): Promise<Order[]> => {
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('status', OrderStatusEnum.COLLECTED)
        .gte('collected_at', startOfDay)
        .lte('collected_at', endOfDay)
        .order('collected_at', { ascending: false });

    if (error) throw new Error(getErrorMessage(error));
    return (data || []).map(mapOrder);
};

export const placeOrder = async (orderData: any): Promise<Order> => {
    const qrToken = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    
    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert([{
            student_id: orderData.studentId,
            student_name: orderData.studentName,
            customer_phone: orderData.customerPhone || orderData.customer_phone || '',
            seat_number: orderData.seatNumber || orderData.seat_number || '',
            total_amount: Number(orderData.totalAmount || orderData.total_amount || 0),
            qr_token: qrToken,
            status: OrderStatusEnum.PENDING
        }])
        .select()
        .single();

    if (orderErr) throw new Error(`Order placement failed: ${getErrorMessage(orderErr)}`);

    const itemsToInsert = orderData.items.map((item: any) => ({
        order_id: order.id,
        menu_item_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes || null,
        image_url: item.imageUrl || item.image_url || '',
        selected_slot_id: item.selectedSlotId || item.selected_slot_id || null,
        selected_start_time: item.selectedStartTime || item.selected_start_time || null,
        duration_minutes: item.durationMinutes || item.duration_minutes || 60,
        category: normalizeCategory(item.category),
        is_delivered: false,
        delivered_quantity: 0
    }));

    const { error: itemsErr } = await supabase.from('order_items').insert(itemsToInsert);
    if (itemsErr) throw new Error(`Item placement failed: ${getErrorMessage(itemsErr)}`);

    return mapOrder({ ...order, order_items: itemsToInsert });
};

export const verifyQrCode = async (token: string): Promise<Order> => { 
    const cleanToken = token.trim();
    const { data: order, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('qr_token', cleanToken)
        .maybeSingle();

    if (error) throw new Error(`Database error: ${error.message}`);
    if (!order) throw new Error("Order not found. This QR might be expired or invalid."); 
    
    return mapOrder(order);
};

export const updatePartialDelivery = async (orderId: string, itemIds: string[], staffId: string): Promise<Order> => {
    const { error: itemsErr } = await supabase
        .from('order_items')
        .update({ is_delivered: true })
        .eq('order_id', orderId)
        .in('menu_item_id', itemIds);

    if (itemsErr) throw new Error(`Delivery update failed: ${getErrorMessage(itemsErr)}`);

    const { data: allItems, error: fetchErr } = await supabase
        .from('order_items')
        .select('is_delivered')
        .eq('order_id', orderId);

    if (fetchErr) throw fetchErr;

    const allDelivered = (allItems || []).every(i => i.is_delivered);
    const newStatus = allDelivered ? OrderStatusEnum.COLLECTED : OrderStatusEnum.PARTIALLY_COLLECTED;

    const { data: updatedOrder, error: orderErr } = await supabase
        .from('orders')
        .update({ 
            status: newStatus, 
            collected_by_staff_id: staffId,
            updated_at: new Date().toISOString(),
            ...(allDelivered ? { collected_at: new Date().toISOString() } : {})
        })
        .eq('id', orderId)
        .select('*, order_items(*)')
        .single();

    if (orderErr) throw orderErr;
    return mapOrder(updatedOrder);
};

export const verifyQrCodeAndCollectOrder = async (token: string, staffId: string): Promise<Order> => { 
    const order = await verifyQrCode(token); 
    if (order.status === OrderStatusEnum.COLLECTED) throw new Error("This order is already fully collected."); 
    const itemIds = order.items.map(i => i.id);
    return await updatePartialDelivery(order.id, itemIds, staffId);
};

// --- MENU OPERATIONS ---

const FALLBACK_MENU: MenuItem[] = [];

export const getMenu = async (studentId?: string): Promise<MenuItem[]> => { 
    try { 
        const { data, error } = await supabase
            .from('menu_items')
            .select('*')
            .limit(100)
            .order('name', { ascending: true }); 

        if (error) throw error; 
        
        let menu = (data || []).map(mapMenuItem); 

        if (menu.length === 0) {
            console.warn("No menu items found in database, using fallback data.");
            menu = FALLBACK_MENU;
        }

        if (studentId && menu.length > 0) { 
            const { data: favs } = await supabase.from('favorites').select('menu_item_id').eq('student_id', studentId); 
            const favIds = new Set(favs?.map(f => f.menu_item_id) || []); 
            menu = menu.map(item => ({ ...item, isFavorited: favIds.has(item.id) })); 
        } 
        return menu; 
    } catch (err) { 
        console.error("getMenu error:", err);
        // Fallback to mock data on network error
        return FALLBACK_MENU; 
    } 
};

export const getMenuItemById = async (itemId: string, studentId?: string): Promise<MenuItem | undefined> => { 
    try { 
        const { data, error } = await supabase.from('menu_items').select('*').eq('id', itemId).single(); 
        if (error) throw error; 
        const item = mapMenuItem(data);
        if (studentId) { 
            try { 
                const { data: fav } = await supabase.from('favorites').select('id').eq('student_id', studentId).eq('menu_item_id', itemId).maybeSingle(); 
                item.isFavorited = !!fav; 
            } catch (e) {} 
        } 
        return item; 
    } catch (err) { return undefined; } 
};

export const addMenuItem = async (itemData: any, ownerId: string) => { 
    const { data, error } = await supabase.from('menu_items').insert([{ ...itemData, owner_id: ownerId }]).select().single(); 
    if (error) throw new Error(getErrorMessage(error)); 
    return data; 
};

export const updateMenuItem = async (id: string, itemData: any) => { 
    const { data, error } = await supabase.from('menu_items').update(itemData).eq('id', id).select().single(); 
    if (error) throw new Error(getErrorMessage(error)); 
    return data; 
};

export const removeMenuItem = async (id: string) => { 
    const { error } = await supabase.from('menu_items').delete().eq('id', id); 
    if (error) throw new Error(getErrorMessage(error)); 
};

export const updateMenuAvailability = async (id: string, isAvailable: boolean) => { 
    const { error = null } = await supabase.from('menu_items').update({ is_available: isAvailable }).eq('id', id); 
    if (error) throw new Error(getErrorMessage(error)); 
};

// --- STAFF MANAGEMENT ---

export const getScanTerminalStaff = async (): Promise<User[]> => { 
    try { 
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', Role.CANTEEN_OWNER)
            .is('canteen_name', null)
            .order('username');
            
        if (error) throw error; 
        return (data || []).map(p => ({ 
            ...p, 
            approvalStatus: p.approval_status,
            staffRole: p.staff_role,
            isActiveProfile: p.is_active_profile
        })) as User[]; 
    } catch { return []; } 
};

export const addStaffMember = async (staffData: any) => {
    const newId = crypto.randomUUID();
    const { data, error } = await supabase
        .from('profiles')
        .insert([{
            id: newId,
            username: staffData.name,
            phone: staffData.phone,
            password: staffData.password,
            role: Role.CANTEEN_OWNER,
            staff_role: staffData.role,
            is_active_profile: staffData.isActive,
            approval_status: 'approved'
        }])
        .select()
        .single();

    if (error) throw new Error(getErrorMessage(error));
    return data;
};

export const updateStaffMember = async (id: string, staffData: any) => {
    const { error } = await supabase
        .from('profiles')
        .update({
            username: staffData.name,
            phone: staffData.phone,
            password: staffData.password,
            staff_role: staffData.role,
            is_active_profile: staffData.isActive
        })
        .eq('id', id);

    if (error) throw new Error(getErrorMessage(error));
};

export const deleteStaffMember = async (id: string) => {
    const { error = null } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw new Error(getErrorMessage(error));
};

// --- MISC ---

export const createPaymentRecord = async (data: any) => { 
    const { error } = await supabase.from('payments').insert([data]); 
    if (error) throw new Error(`Payment logging failed: ${getErrorMessage(error)}`); 
};

export const getStudentOrders = async (studentId: string): Promise<Order[]> => { 
    try { 
        const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('student_id', studentId).order('timestamp', { ascending: false }); 
        if (error) throw error; 
        return (data || []).map(mapOrder); 
    } catch (err) { return []; } 
};

export const updateOrderStatus = async (order_id: string, status: OrderStatusEnum): Promise<void> => { 
    const { error = null } = await supabase.from('orders').update({ status }).eq('id', order_id); 
    if (error) throw new Error(getErrorMessage(error)); 
};

export const getOrderById = async (id: string): Promise<Order> => { 
    try { 
        if (!id) {
            throw new Error("Order ID is required");
        }
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let query = supabase.from('orders').select('*, order_items(*)');
        if (isUuid) {
            query = query.eq('id', id);
        } else {
            query = query.eq('qr_token', id);
        }
        const { data, error } = await query.single(); 
        if (error) throw error; 
        if (!data) throw new Error("Order not found in database");
        return mapOrder(data); 
    } catch (e: any) { 
        console.error("Database error in getOrderById:", e);
        throw new Error("Could not find order. " + (e?.message || e)); 
    } 
};

export const simulateIncomingOrder = async (): Promise<void> => { 
    const { data: menu } = await supabase.from('menu_items').select('*').limit(1); 
    if (!menu || menu.length === 0) throw new Error("No menu items to simulate order with."); 
    const orderData = { studentId: 'simulated-user-id', studentName: 'Simulated Customer', items: [{ ...menu[0], id: menu[0].id, quantity: 1, price: menu[0].price }], totalAmount: menu[0].price, seatNumber: 'SIM-1' }; 
    await placeOrder(orderData); 
};

export const checkSlotAvailability = async (itemId: string, slotId: string, startTimeIso: string, durationMinutes: number): Promise<AvailabilityResult> => { 
    try { 
        const requestedStart = new Date(startTimeIso); 
        const requestedEnd = new Date(requestedStart.getTime() + (durationMinutes * 60000)); 
        
        // Find if this service belongs to any combined service groups sharing availability
        let serviceIdsToCheck = [itemId];
        try {
            const { data: groups } = await supabase.from('combined_groups').select('service_ids, room_ids');
            if (groups && groups.length > 0) {
                // Find a group containing this itemId
                const matchingGroup = groups.find(g => 
                    g.service_ids && g.service_ids.includes(itemId)
                );
                if (matchingGroup && matchingGroup.service_ids) {
                    serviceIdsToCheck = matchingGroup.service_ids;
                }
            } else {
                // Check local storage fallback if empty
                const cached = localStorage.getItem('local_combined_groups');
                if (cached) {
                    const localList: CombinedGroup[] = JSON.parse(cached);
                    const matchingGroup = localList.find(g => g.serviceIds && g.serviceIds.includes(itemId));
                    if (matchingGroup && matchingGroup.serviceIds) {
                        serviceIdsToCheck = matchingGroup.serviceIds;
                    }
                }
            }
        } catch (e) {
            console.log("No combined groups retrieved (or table not created yet), using standard availability lookup.", e);
        }

        const { data, error } = await supabase.from('order_items')
            .select('*, orders!inner(status)')
            .in('menu_item_id', serviceIdsToCheck)
            .eq('selected_slot_id', slotId)
            .in('orders.status', ['pending', 'prepared', 'collected', 'partially_collected']); 

        if (error) return { isAvailable: true }; 
        if (!data || data.length === 0) return { isAvailable: true }; 
        let conflictFound: any = null; 
        const hasOverlap = data.some(item => { 
            const bookedStartRaw = item.selected_start_time || item.selectedStartTime; 
            if (!bookedStartRaw) return false; 
            const bookedStart = new Date(bookedStartRaw); 
            const duration = Number(item.duration_minutes || 60); 
            const bookedEnd = new Date(bookedStart.getTime() + (duration * 60000)); 
            const isConflicting = (bookedStart < requestedEnd) && (bookedEnd > requestedStart); 
            if (isConflicting) conflictFound = { start: bookedStart.toISOString(), end: bookedEnd.toISOString() }; 
            return isConflicting; 
        }); 
        if (hasOverlap && conflictFound) return { isAvailable: false, conflict: conflictFound }; 
        return { isAvailable: true }; 
    } catch (err) { return { isAvailable: true }; } 
};

// --- COMBINED SERVICES GROUPS ---

export const getCombinedGroups = async (): Promise<CombinedGroup[]> => {
    try {
        const { data, error } = await supabase.from('combined_groups').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return (data || []).map(g => ({
            id: g.id,
            name: g.name,
            description: g.description,
            serviceIds: g.service_ids || [],
            roomIds: g.room_ids || [],
            ownerId: g.owner_id,
            createdAt: g.created_at
        }));
    } catch (err) {
        console.warn("Combined groups fetch failed, returning empty local list.", err);
        try {
            const cached = localStorage.getItem('local_combined_groups');
            return cached ? JSON.parse(cached) : [];
        } catch {
            return [];
        }
    }
};

export const createCombinedGroup = async (groupData: Omit<CombinedGroup, 'id' | 'createdAt'>): Promise<CombinedGroup> => {
    const payload = {
        name: groupData.name,
        description: groupData.description,
        service_ids: groupData.serviceIds,
        room_ids: groupData.roomIds,
        owner_id: groupData.ownerId
    };
    try {
        const { data, error } = await supabase.from('combined_groups').insert([payload]).select().single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            serviceIds: data.service_ids || [],
            roomIds: data.room_ids || [],
            ownerId: data.owner_id,
            createdAt: data.created_at
        };
    } catch (err) {
        console.warn("Combined groups save failed, fallback to local storage.", err);
        const mockGroup: CombinedGroup = {
            id: Math.random().toString(36).substr(2, 9),
            name: groupData.name,
            description: groupData.description,
            serviceIds: groupData.serviceIds,
            roomIds: groupData.roomIds,
            ownerId: groupData.ownerId,
            createdAt: new Date().toISOString()
        };
        try {
            const cached = localStorage.getItem('local_combined_groups');
            const list = cached ? JSON.parse(cached) : [];
            list.push(mockGroup);
            localStorage.setItem('local_combined_groups', JSON.stringify(list));
        } catch {}
        return mockGroup;
    }
};

export const updateCombinedGroup = async (id: string, groupData: Partial<CombinedGroup>): Promise<CombinedGroup> => {
    const payload: any = {};
    if (groupData.name !== undefined) payload.name = groupData.name;
    if (groupData.description !== undefined) payload.description = groupData.description;
    if (groupData.serviceIds !== undefined) payload.service_ids = groupData.serviceIds;
    if (groupData.roomIds !== undefined) payload.room_ids = groupData.roomIds;

    try {
        const { data, error } = await supabase.from('combined_groups').update(payload).eq('id', id).select().single();
        if (error) throw error;
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            serviceIds: data.service_ids || [],
            roomIds: data.room_ids || [],
            ownerId: data.owner_id,
            createdAt: data.created_at
        };
    } catch (err) {
        console.warn("Combined groups update failed, falling back to local list.", err);
        try {
            const cached = localStorage.getItem('local_combined_groups');
            let list: CombinedGroup[] = cached ? JSON.parse(cached) : [];
            list = list.map(g => g.id === id ? { ...g, ...groupData } : g);
            localStorage.setItem('local_combined_groups', JSON.stringify(list));
            return list.find(g => g.id === id)!;
        } catch {
            return {
                id,
                name: groupData.name || '',
                serviceIds: groupData.serviceIds || [],
                roomIds: groupData.roomIds || []
            };
        }
    }
};

export const deleteCombinedGroup = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from('combined_groups').delete().eq('id', id);
        if (error) throw error;
    } catch (err) {
        console.warn("Combined groups delete failed, falling back to local list.", err);
        try {
            const cached = localStorage.getItem('local_combined_groups');
            let list: CombinedGroup[] = cached ? JSON.parse(cached) : [];
            list = list.filter(g => g.id !== id);
            localStorage.setItem('local_combined_groups', JSON.stringify(list));
        } catch {}
    }
};


export const submitFeedback = async (feedbackData: any): Promise<void> => { 
    const { error = null } = await supabase.from('feedbacks').insert([{ student_id: feedbackData.studentId, menu_item_id: feedbackData.itemId, rating: feedbackData.rating, comment: feedbackData.comment }]); 
    if (error) throw new Error(getErrorMessage(error)); 
};

export const getFeedbacks = async (): Promise<Feedback[]> => { 
    try { 
        const { data, error } = await supabase.from('feedbacks').select('*, profiles(username), menu_items(name)'); 
        if (error) throw error; 
        return (data || []).map(f => ({ id: f.id, studentId: f.student_id, studentName: f.profiles?.username || 'Anonymous', itemId: f.menu_item_id, itemName: f.menu_items?.name || 'Deleted Item', rating: f.rating, comment: f.comment, timestamp: new Date(f.created_at) })) as Feedback[]; 
    } catch (err) { return []; } 
};

export const requestSaveBankDetailsOtp = async (details: OwnerBankDetails): Promise<void> => { return Promise.resolve(); };
export const verifyOtpAndSaveBankDetails = async (details: OwnerBankDetails, otp: string, userId: string): Promise<OwnerBankDetails> => { 
    if (otp !== '123456') throw new Error("Invalid OTP"); 
    const { error = null } = await supabase.from('profiles').update({ bank_details: details }).eq('id', userId); 
    if (error) throw new Error(getErrorMessage(error)); 
    return details; 
};

export const getOwnerBankDetails = async (ownerId: string): Promise<OwnerBankDetails> => { 
    const { data, error } = await supabase.from('profiles').select('bank_details').eq('id', ownerId).single(); 
    if (error || !data.bank_details) return { accountNumber: '', bankName: '', ifscCode: '', email: '', phone: '' }; 
    return data.bank_details; 
};

export const deleteScanTerminalStaff = async (userId: string): Promise<void> => { 
    const { error = null } = await supabase.from('profiles').delete().eq('id', userId); 
    if (error) throw new Error(getErrorMessage(error)); 
};

export const getAllOffersForOwner = async (): Promise<Offer[]> => { 
    try { 
        const { data, error } = await supabase.from('offers').select('*').order('created_at', { ascending: false }); 
        if (error) throw error; 
        return data as Offer[]; 
    } catch { return []; } 
};

export const createOffer = async (offerData: any) => { 
    const { data, error } = await supabase.from('offers').insert([offerData]).select().single(); 
    if (error) throw new Error(getErrorMessage(error)); 
    return data; 
};

export const updateOffer = async (id: string, offerData: any) => { 
    const { data, error } = await supabase.from('offers').update(offerData).eq('id', id).select().single(); 
    if (error) throw new Error(getErrorMessage(error)); 
    return data; 
};

export const deleteOffer = async (id: string) => { 
    const { error = null } = await supabase.from('offers').delete().eq('id', id); 
    if (error) throw new Error(getErrorMessage(error)); 
};

export const getAllRewardsForOwner = async (): Promise<Reward[]> => { 
    try { 
        const { data, error } = await supabase.from('rewards').select('*').order('points_cost', { ascending: true }); 
        if (error) throw error; 
        return (data || []).map(r => ({ ...r, expiryDate: r.expiry_date })); 
    } catch { return []; } 
};

export const createReward = async (rewardData: any) => { 
    const { data, error } = await supabase.from('rewards').insert([{ title: rewardData.title, description: rewardData.description, points_cost: rewardData.pointsCost, discount: rewardData.discount, is_active: rewardData.isActive, expiry_date: rewardData.expiryDate }]).select().single(); 
    if (error) throw new Error(getErrorMessage(error)); 
    return data; 
};

export const updateReward = async (id: string, rewardData: any) => { 
    const { data, error } = await supabase.from('rewards').update({ title: rewardData.title, description: rewardData.description, points_cost: rewardData.pointsCost, discount: rewardData.discount, is_active: rewardData.isActive, expiry_date: rewardData.expiryDate }).eq('id', id).select().single(); 
    if (error) throw new Error(getErrorMessage(error)); 
    return data; 
};

export const deleteReward = async (id: string) => { 
    const { error = null } = await supabase.from('rewards').delete().eq('id', id); 
    if (error) throw new Error(getErrorMessage(error)); 
};

export const redeemReward = async (studentId: string, rewardId: string): Promise<Offer> => { 
    const { data: profile } = await supabase.from('profiles').select('loyalty_points').eq('id', studentId).single(); 
    const { data: reward } = await supabase.from('rewards').select('*').eq('id', rewardId).single(); 
    if (!profile || !reward) throw new Error("Reward data not found"); 
    if ((profile.loyalty_points || 0) < reward.points_cost) throw new Error("Insufficient points"); 
    await supabase.from('profiles').update({ loyalty_points: profile.loyalty_points - reward.points_cost }).eq('id', studentId); 
    const { data: offer, error: offerErr } = await supabase.from('offers').insert([{ code: `REWARD-${Math.random().toString(36).substring(7).toUpperCase()}`, description: reward.description, discount_type: reward.discount.type, discount_value: reward.discount.value, is_used: false, student_id: studentId, is_reward: true }]).select().single(); 
    if (offerErr) throw offerErr; 
    return offer as Offer; 
};

export const getCanteenPhotos = async (): Promise<CanteenPhoto[]> => { 
    const { data, error } = await supabase.from('canteen_photos').select('*').order('created_at', { ascending: false }); 
    if (error) return []; 
    return (data || []).map(p => ({ id: p.id, data: p.data, uploadedAt: new Date(p.created_at) })); 
};

export const addCanteenPhoto = async (file: File): Promise<CanteenPhoto> => { 
    const reader = new FileReader(); 
    const base64 = await new Promise<string>((resolve) => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(file); }); 
    const { data, error } = await supabase.from('canteen_photos').insert([{ data: base64 }]).select().single(); 
    if (error) throw error; 
    return { id: data.id, data: data.data, uploadedAt: new Date(data.created_at) }; 
};

export const deleteCanteenPhoto = async (id: string): Promise<void> => { await supabase.from('canteen_photos').delete().eq('id', id); };

export const updateCanteenPhoto = async (id: string, file: File): Promise<CanteenPhoto> => { 
    const reader = new FileReader(); 
    const base64 = await new Promise<string>((resolve) => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(file); }); 
    const { data, error } = await supabase.from('canteen_photos').update({ data: base64 }).eq('id', id).select().single(); 
    if (error) throw error; 
    return { id: data.id, data: data.data, uploadedAt: new Date(data.created_at) }; 
};

export const updateOwnerApprovalStatus = async (userId: string, status: 'approved' | 'rejected'): Promise<void> => { 
    const { error = null } = await supabase.from('profiles').update({ approval_status: status, approval_date: status === 'approved' ? new Date().toISOString() : null }).eq('id', userId); 
    if (error) throw new Error(getErrorMessage(error)); 
};

export const removeOwnerAccount = async (userId: string): Promise<void> => { 
    const { error = null } = await supabase.from('profiles').delete().eq('id', userId); 
    if (error) throw new Error(getErrorMessage(error)); 
};

export const getAllCommissions = async (): Promise<CommissionRecord[]> => { 
    try { 
        const { data, error } = await supabase.from('commissions').select('*').order('created_at', { ascending: false }); 
        if (error) return []; 
        return (data || []).map(c => ({ id: c.id, month: c.month, totalIncome: c.total_income, commissionAmount: c.commission_amount, ownerId: c.owner_id, ownerName: c.owner_name })); 
    } catch { return []; } 
};

export const getOwnerCommissions = async (ownerId: string): Promise<CommissionRecord[]> => { 
    try { 
        const { data, error } = await supabase.from('commissions').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }); 
        if (error) return []; 
        return (data || []).map(c => ({ id: c.id, month: c.month, totalIncome: c.total_income, commissionAmount: c.commission_amount, ownerId: c.owner_id, ownerName: c.owner_name })); 
    } catch { return []; } 
};

export const generateMonthlyCommissions = async (): Promise<void> => { 
    return Promise.resolve(); 
};

export const getApprovedOwners = async (): Promise<User[]> => { 
    const { data, error } = await supabase.from('profiles').select('*').eq('role', Role.CANTEEN_OWNER).eq('approval_status', 'approved'); 
    if (error) throw new Error(getErrorMessage(error)); 
    return (data || []).map(p => ({ ...p, approvalStatus: p.approval_status, canteenName: p.canteen_name, idProofUrl: p.id_proof_url, approvalDate: p.approval_date })) as any; 
};

export const getUsers = async (): Promise<User[]> => { 
    try { 
        const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); 
        if (error) throw error; 
        return data as any; 
    } catch (err) { return []; } 
};

export const getAdminDashboardStats = async (): Promise<AdminStats> => { 
    try { 
        const [{ count: totalUsers }, { count: totalCustomers }, { count: totalOwners }, { count: pendingApprovals }, { count: totalFeedbacks }] = await Promise.all([ supabase.from('profiles').select('*', { count: 'exact', head: true }), supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', Role.STUDENT), supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', Role.CANTEEN_OWNER), supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', Role.CANTEEN_OWNER).eq('approval_status', 'pending'), supabase.from('feedbacks').select('*', { count: 'exact', head: true }) ]); 
        return { totalUsers: totalUsers || 0, totalCustomers: totalCustomers || 0, totalOwners: totalOwners || 0, pendingApprovals: pendingApprovals || 0, totalFeedbacks: totalFeedbacks || 0 }; 
    } catch (err) { return { totalUsers: 0, totalCustomers: 0, totalOwners: 0, pendingApprovals: 0, totalFeedbacks: 0 }; } 
};

export const getTodaysDashboardStats = async (): Promise<TodaysDashboardStats> => { 
    try { 
        const today = new Date().toISOString().split('T')[0]; 
        const { data, error } = await supabase.from('orders').select('total_amount, order_items(name, quantity)').gte('timestamp', today).neq('status', 'cancelled'); 
        if (error) throw error; 
        const totalIncome = (data || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0); 
        const itemCounts: Record<string, number> = {}; 
        (data || []).forEach(o => { (o.order_items as any[]).forEach((oi: any) => { itemCounts[oi.name] = (itemCounts[oi.name] || 0) + (oi.quantity || 0); }); }); 
        return { totalOrders: (data || []).length, totalIncome, itemsSold: Object.entries(itemCounts).map(([name, quantity]) => ({ name, quantity })) }; 
    } catch (err) { 
        console.error("Dashboard Stats Error:", err);
        return { 
            totalOrders: 0, 
            totalIncome: 0, 
            itemsSold: [] 
        }; 
    } 
};

export const getOwnerStatus = async (ownerId?: string): Promise<{ isOnline: boolean }> => { 
    try { 
        const { count, error } = await supabase.from('menu_items').select('*', { count: 'exact', head: true }).eq('is_available', true); 
        if (error) throw error; 
        return { isOnline: (count || 0) > 0 }; 
    } catch (e) { return { isOnline: true }; } 
};

export const getStudentProfile = async (id: string): Promise<StudentProfile> => { 
    try { 
        const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single(); 

        if (profileErr || !profile) throw new Error("Profile not found"); 

        const [
            { count: totalOrders },
            { data: ordersData },
            { count: favoritesCount }
        ] = await Promise.all([
            supabase.from('orders').select('*', { count: 'exact', head: true }).eq('student_id', id).neq('status', 'cancelled'),
            supabase.from('orders').select('total_amount').eq('student_id', id).neq('status', 'cancelled'),
            supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('student_id', id)
        ]);

        const lifetimeSpend = (ordersData || []).reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

        return { 
            id: profile.id, 
            name: profile.username, 
            phone: profile.phone || '', 
            totalOrders: totalOrders || 0, 
            lifetimeSpend: lifetimeSpend, 
            favoriteItemsCount: favoritesCount || 0, 
            loyaltyPoints: profile.loyalty_points || 0 
        }; 
    } catch (err) { 
        console.error("Profile Fetch Error:", err);
        return { 
            id, 
            name: 'Screen customer', 
            phone: '', 
            totalOrders: 0, 
            lifetimeSpend: 0, 
            favoriteItemsCount: 0,
            loyaltyPoints: 0
        }; 
    } 
};

export const getAllStudentCoupons = async (id: string) => { 
    try { 
        const { data, error } = await supabase.from('offers').select('*').eq('student_id', id); 
        if (error) return []; 
        return data as Offer[]; 
    } catch { return []; } 
};

export const getOwnerOrders = async (): Promise<Order[]> => { 
    try { 
        const { data, error } = await supabase.from('orders').select('*, order_items(*)').order('timestamp', { ascending: false }); 
        if (error) throw error; 
        return (data || []).map(mapOrder); 
    } catch (err) { return []; } 
};

export const getSalesSummary = async (): Promise<SalesSummary> => ({ daily: [], weekly: [] });
export const getMostSellingItems = async () => [];
export const getOrderStatusSummary = async () => [];
export const getStudentPointsList = async () => [];
export const getTodaysDetailedReport = async (): Promise<TodaysDetailedReport> => ({ date: '', totalOrders: 0, totalIncome: 0, itemSales: [] });

export const updateOrderSeatNumber = async (id: string, sn: string) => { 
    const { error = null } = await supabase.from('orders').update({ seat_number: sn }).eq('id', id); 
    if (error) throw new Error(getErrorMessage(error)); 
};

export const getFoodPopularityStats = async () => { 
    try { 
        const { data, error } = await supabase.from('menu_items').select('*').order('average_rating', { ascending: false }); 
        if (error) return []; 
        return data.map(i => ({ ...i, favoriteCount: i.favorite_count, averageRating: i.average_rating })); 
    } catch { return []; } 
};

export const getPendingOwnerRequests = async (): Promise<User[]> => { 
    const { data, error } = await supabase.from('profiles').select('*').eq('role', Role.CANTEEN_OWNER).eq('approval_status', 'pending'); 
    if (error) throw new Error(getErrorMessage(error)); 
    return (data || []).map(p => ({ ...p, approvalStatus: p.approval_status, canteenName: p.canteen_name, idProofUrl: p.id_proof_url })) as any; 
};

export const getRejectedOwners = async (): Promise<User[]> => { 
    const { data, error } = await supabase.from('profiles').select('*').eq('role', Role.CANTEEN_OWNER).eq('approval_status', 'rejected'); 
    if (error) throw new Error(getErrorMessage(error)); 
    return (data || []).map(p => ({ ...p, approvalStatus: p.approval_status, canteenName: p.canteen_name, idProofUrl: p.id_proof_url })) as any; 
};

export const toggleFavoriteItem = async (studentId: string, itemId: string): Promise<void> => { 
    const { data: existing } = await supabase.from('favorites').select('id').eq('student_id', studentId).eq('menu_item_id', itemId).maybeSingle(); 
    if (existing) { await supabase.from('favorites').delete().eq('id', existing.id); } 
    else { await supabase.from('favorites').insert([{ student_id: studentId, menu_item_id: itemId }]); } 
};
