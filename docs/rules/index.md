---
aside: false
---

<script setup>
import { data } from "./index.data"

const categories = { recommended: "Recommended", react: "React", scope: "Scope" }

const rulesByCategory = (category) => data.filter((rule) => rule.category === category)
</script>

# Rules

<template v-for="(title, category) in categories" :key="category">
  <h2 :id="category">{{ title }}</h2>

  <table>
    <thead>
      <tr>
        <th>Rule</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="rule in rulesByCategory(category)" :key="rule.key">
        <td><a :href="`/rules/${rule.key}`">{{rule.key}}</a></td>
        <td>{{rule.description}}</td>
      </tr>
    </tbody>
  </table>
</template>
