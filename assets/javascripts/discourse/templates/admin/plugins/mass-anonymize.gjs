import { LinkTo } from "@ember/routing";
import { Input } from "@ember/component";
import { on } from "@ember/modifier";
import { fn } from "@ember/helper";
import DButton from "discourse/components/d-button";

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
{{#if (@controller.not (@controller.isProcessing user))}}
<Input @type="checkbox" @checked={{@controller.isChecked user}} {{on "change" (fn @controller.setSelected user) }} />
{{else}}
{{#if (@controller.not (@controller.isDone user))}}
&#8635;
{{else}}
&#x2713;
{{/if}}
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
  @label="mass_anonymize.select_all_btn"
  @action={{@controller.selectAll}}
  @icon="eye"
  @id="select-all"
/>
<DButton
  @label="mass_anonymize.deselect_all_btn"
  @action={{@controller.deselectAll}}
  @icon="eye"
  @id="deselect-all"
/>

<DButton
  @label="mass_anonymize.anonymize_all_btn"
  @action={{@controller.anonymizeAll}}
  @icon="eye"
  @id="anonymize-all"
/>
{{/if}}
</template>
