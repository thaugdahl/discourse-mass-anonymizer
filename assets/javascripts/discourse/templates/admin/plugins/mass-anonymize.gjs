import { LinkTo } from "@ember/routing";
import DButton from "discourse/components/d-button";
import { fn } from "@ember/helper";

export default <template>

<div class="buttons">
<DButton
  @label="mass_anonymize.get_users_btn"
  @action={{@controller.getUsers}}
  @icon="eye"
  @id="get-users"
/>

</div>

{{#if @controller.isLoading}}
Loading...
{{/if}}

{{#if @controller.eligibleUsers}}
<h3>Eligible Users</h3>
<div style="max-height:500px;overflow:scroll;border:1px solid #000;">
<ul>
{{#each @controller.eligibleUsers as |user|}}
<li>
{{#if user.anonymized}}
&#x2713;
{{/if}}
<LinkTo @route="adminUser" @model={{user}}>
  {{user.username}}
</LinkTo>
({{user.days_since}} since last seen)
</li>
{{else}}
<li>Sorry, nobody here</li>
{{/each}}
</ul>
</div>

<DButton
  @label="mass_anonymize.anonymize_all_btn"
  @action={{@controller.anonymizeAll}}
  @icon="eye"
  @id="anonymize-all"
/>
{{/if}}
</template>
