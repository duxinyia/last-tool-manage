<template>
	<div class="table-container layout-padding">
		<div class="table-padding layout-padding-view layout-padding-auto">
			<iframe :src="url" frameborder="0" height="100%" width="100%" ref="iframeRef" />
		</div>
	</div>
</template>

<script setup lang="ts" name="checkNode">
import { ref, onBeforeMount } from 'vue';
let url = ref('');
import Cookies from 'js-cookie';
onBeforeMount(() => {
	url.value = window.webConfig.taskListIndexUrl + Cookies.get('userId');
});
</script>
<style scoped lang="scss">
.table-container {
	.table-padding {
		padding: 15px;
	}
}
</style>
