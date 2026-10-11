<script setup>
// After a result: one light question (how was it?), then the way forward that
// fits the answer, as Labs' Portfolio Engine asks it. Pleased readers get the
// low-effort ways to say thanks (a star, a share, their story); stuck readers
// get a problem report or a feature request. Every link opens one of the
// repository's GitHub issue forms with the tool and page filled in; nothing is
// sent from here. The answer is remembered in this browser, so it is not asked
// on every visit, and never leaves it.
import { computed, onBeforeUnmount, ref } from "vue";
import { Bug, Check, Lightbulb, MessageSquareHeart, Share2, Star, ThumbsDown, ThumbsUp } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const props = defineProps({
  // Where the feedback goes: "Xfina Labs".
  product: { type: String, required: true },
  // What was used, if the product has several: "Portfolio Engine". It names
  // the card and fills each issue form's Tool field (the product, without it).
  tool: { type: String, default: undefined },
  // The GitHub repository the issues open in: https://github.com/owner/name.
  repo: { type: String, required: true },
  // The localStorage key the answer is kept under, one per tool.
  storageKey: { type: String, required: true },
  // The issue forms in the repository's .github/ISSUE_TEMPLATE/, by file name
  // without .yml. Any left out keep these names.
  templates: { type: Object, default: () => ({}) },
  // A one-line lead-in, centred between two rules above the card.
  nudge: { type: String, default: undefined },
  class: { type: [Boolean, null, String, Object, Array], required: false, skipCheck: true },
});

const TEMPLATES = { problem: "problem", idea: "idea", story: "story" };

// A repository URL with a trailing slash or a path would build issue links
// that 404 on GitHub, and only for the reader who clicks one.
if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(props.repo)) {
  throw new Error(`FeedbackCard: repo must be https://github.com/<owner>/<name>, got "${props.repo}"`);
}
for (const name of Object.keys(props.templates)) {
  if (!(name in TEMPLATES)) {
    throw new Error(`FeedbackCard: unknown template "${name}"; the templates are ${Object.keys(TEMPLATES).join(", ")}`);
  }
}
const templates = { ...TEMPLATES, ...props.templates };

const subject = computed(() => props.tool ?? props.product);
const title = computed(() => (props.tool ? `${props.product} / ${props.tool}` : props.product));

// localStorage throws in some private windows and when storage is blocked;
// the answer then lasts for this visit only.
const read = () => {
  try {
    const stored = localStorage.getItem(props.storageKey);
    return stored === "up" || stored === "down" ? stored : null;
  } catch {
    return null;
  }
};
const answer = ref(read()); // 'up' | 'down' | null
// The answer stays shown as selected: the other button switches it, the same
// one again clears it.
function choose(choice) {
  answer.value = answer.value === choice ? null : choice;
  try {
    if (answer.value) localStorage.setItem(props.storageKey, answer.value);
    else localStorage.removeItem(props.storageKey);
  } catch {
    /* remembered for this visit only */
  }
}

const page = () => `${location.origin}${location.pathname}`;

// A new issue from one of the repository's forms. GitHub fills a form's field
// from the query parameter named by its id, so `tool` and `environment` must
// match the forms' ids. Tool is required on every form, so a product without
// tools fills it with its own name.
function issue(template) {
  const query = new URLSearchParams({ template: `${templates[template]}.yml`, tool: subject.value });
  if (template === "problem") query.set("environment", `Page: ${page()}\nBrowser: ${navigator.userAgent}`);
  return `${props.repo}/issues/new?${query}`;
}
const links = computed(() => ({ problem: issue("problem"), idea: issue("idea"), story: issue("story") }));

const description = computed(() =>
  answer.value === "up"
    ? "Thank you! If you would like to say thanks, any of these goes a long way."
    : answer.value === "down"
      ? "Thanks for saying so. What got in the way? Tell us and we will look into it."
      : `How was ${subject.value} for you? It is free and open source, built in the open, and your feedback shapes what comes next.`,
);

// Share: the phone's share sheet where there is one, otherwise the link copied.
const copied = ref(false);
let timer;
async function share() {
  const url = page();
  try {
    if (navigator.share) return await navigator.share({ title: props.tool ? `${props.tool} · ${props.product}` : props.product, url });
    await navigator.clipboard.writeText(url);
    clearTimeout(timer);
    copied.value = true;
    timer = setTimeout(() => (copied.value = false), 2000);
  } catch {
    /* share sheet closed, or clipboard blocked */
  }
}
onBeforeUnmount(() => clearTimeout(timer));
</script>

<template>
  <div :class="cn('space-y-10', props.class)">
    <div v-if="nudge" class="flex items-center gap-4">
      <div class="h-px flex-1 bg-border" />
      <p class="shrink text-center text-sm text-muted-foreground">{{ nudge }}</p>
      <div class="h-px flex-1 bg-border" />
    </div>
    <Card>
      <CardHeader class="gap-4 pb-4 md:flex-row md:items-start md:justify-between">
        <div class="min-w-0 flex-1 space-y-1.5">
          <!-- A fixed title naming where the feedback goes; the line under it carries the conversation. -->
          <CardTitle class="text-xl">{{ title }} · Feedback</CardTitle>
          <CardDescription>{{ description }}</CardDescription>
        </div>
        <div class="flex shrink-0 gap-2" role="group" :aria-label="`How was ${subject} for you?`">
          <Button :variant="answer === 'up' ? 'selected' : 'outline'" :aria-pressed="answer === 'up'" @click="choose('up')"><ThumbsUp />Useful</Button>
          <Button :variant="answer === 'down' ? 'selected' : 'outline'" :aria-pressed="answer === 'down'" @click="choose('down')"><ThumbsDown />Could be better</Button>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="answer === 'up'" class="flex flex-wrap gap-2">
          <Button as="a" :href="repo" target="_blank" rel="noopener"><Star />Star on GitHub</Button>
          <Button variant="outline" @click="share"><Check v-if="copied" /><Share2 v-else />{{ copied ? "Link copied" : "Share" }}</Button>
          <Button as="a" variant="outline" :href="links.story" target="_blank" rel="noopener"><MessageSquareHeart />Tell us what you used it for</Button>
        </div>
        <div v-else-if="answer === 'down'" class="flex flex-wrap gap-2">
          <Button as="a" :href="links.problem" target="_blank" rel="noopener"><Bug />Report a problem</Button>
          <Button as="a" variant="outline" :href="links.idea" target="_blank" rel="noopener"><Lightbulb />Request a feature</Button>
        </div>
        <!-- Always there, except when the buttons above already offer the same. -->
        <p v-if="answer !== 'down'" class="text-xs text-muted-foreground">
          Anytime:
          <a :href="links.problem" target="_blank" rel="noopener" class="underline underline-offset-4 hover:text-foreground">report a problem</a> ·
          <a :href="links.idea" target="_blank" rel="noopener" class="underline underline-offset-4 hover:text-foreground">request a feature</a> ·
          <a :href="repo" target="_blank" rel="noopener" class="underline underline-offset-4 hover:text-foreground">source on GitHub</a>.
          These open GitHub, where issues are public.
        </p>
      </CardContent>
    </Card>
  </div>
</template>
