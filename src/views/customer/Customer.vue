<script>
import { onMounted } from 'vue';
import { getCustomer } from '../../services/customer.service';

const data = ref([])
const columns = ref([])

onMounted( async () => {
    try {
        const customer = await getCustomer()
        console.log(customer)
        data.value = customer.data
    } catch (error) {
        
    }
})
</script>

<template>
    <p class="text-black">customer</p>
</template>