<script setup>
import { data } from "./index.data"
</script>

# Rules

<ul>
  <li v-for="rule in data">
    <a :href="`/rules/${rule.key}`">{{rule.key}}</a>
  </li>
</ul>
