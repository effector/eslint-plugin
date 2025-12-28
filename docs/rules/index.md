---
aside: false
---

<script setup>
import { data } from "./index.data"
</script>

# Rules

<table>
  <thead>
    <tr>
      <th>Rule</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="rule in data" :key="rule.key">
      <td><a :href="`/rules/${rule.key}`">{{rule.key}}</a></td>
      <td>{{rule.description}}</td>
    </tr>
  </tbody>
</table>
