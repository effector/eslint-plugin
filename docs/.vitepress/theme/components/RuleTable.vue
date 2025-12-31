<script setup lang="ts">
type Rule = { key: string; description: string }

defineProps<{ rules: Rule[] }>()
</script>

<template>
  <table>
    <colgroup>
      <col style="width: 40%" />
      <col style="width: 60%" />
    </colgroup>

    <thead>
      <tr>
        <th>Rule</th>
        <th>Description</th>
      </tr>
    </thead>

    <tbody>
      <tr v-for="rule in rules" :key="rule.key">
        <td>
          <a :href="`/rules/${rule.key}`">{{ rule.key }}</a>
        </td>
        <td>{{ rule.description }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
table {
  width: 100%;
  display: table;
}
</style>
