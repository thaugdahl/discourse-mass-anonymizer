import { Input } from "@ember/component";
import { fn } from "@ember/helper";
import { on } from "@ember/modifier";
import { LinkTo } from "@ember/routing";
import ConditionalLoadingSpinner from "discourse/components/conditional-loading-spinner";
import DBreadcrumbsItem from "discourse/components/d-breadcrumbs-item";
import DButton from "discourse/components/d-button";
import DPageSubheader from "discourse/components/d-page-subheader";
import icon from "discourse/helpers/d-icon";
import { i18n } from "discourse-i18n";

export default <template>
  <DBreadcrumbsItem
    @path="/admin/plugins/mass-anonymizer/mass-anonymize"
    @label={{i18n "mass_anonymize.title"}}
  />

  <div class="mass-anonymize admin-detail">
    <DPageSubheader
      @titleLabel={{i18n "mass_anonymize.title"}}
      @descriptionLabel={{i18n "mass_anonymize.description"}}
    >
      <:actions as |actions|>
        <actions.Primary
          @label="mass_anonymize.get_users_btn"
          @action={{@controller.getUsers}}
          @icon="users"
          @id="get-users"
        />
      </:actions>
    </DPageSubheader>

    <ConditionalLoadingSpinner @condition={{@controller.isLoading}} />

    {{#unless @controller.isLoading}}
      {{#if @controller.eligibleUsers.length}}
        <div class="mass-anonymize__bulk-actions">
          <DButton
            @label="mass_anonymize.select_all_btn"
            @action={{@controller.selectAll}}
            @icon="check-square"
            @id="select-all"
          />
          <DButton
            @label="mass_anonymize.deselect_all_btn"
            @action={{@controller.deselectAll}}
            @icon="times"
            @id="deselect-all"
          />
          <DButton
            @label="mass_anonymize.anonymize_all_btn"
            @action={{@controller.anonymizeAll}}
            @icon="user-secret"
            @id="anonymize-all"
            class="btn-danger"
          />
        </div>

        <table class="d-table mass-anonymize__table">
          <thead class="d-table__header">
            <tr class="d-table__row">
              <th class="d-table__header-cell mass-anonymize__status-col"></th>
              <th class="d-table__header-cell">{{i18n "mass_anonymize.columns.user"}}</th>
              <th class="d-table__header-cell">{{i18n "mass_anonymize.columns.last_seen"}}</th>
            </tr>
          </thead>
          <tbody class="d-table__body">
            {{#each @controller.eligibleUsers as |user|}}
              <tr class="d-table__row">
                <td class="d-table__cell mass-anonymize__status-cell">
                  {{#if (@controller.isProcessing user)}}
                    {{#if (@controller.isDone user)}}
                      <span class="mass-anonymize__done">{{icon "check"}}</span>
                    {{else}}
                      <span class="mass-anonymize__processing">{{icon "spinner"}}</span>
                    {{/if}}
                  {{else}}
                    <Input
                      @type="checkbox"
                      @checked={{@controller.isChecked user}}
                      {{on "change" (fn @controller.setSelected user)}}
                    />
                  {{/if}}
                </td>
                <td class="d-table__cell --overview">
                  <LinkTo @route="adminUser" @model={{user}}>
                    {{user.username}}
                  </LinkTo>
                </td>
                <td class="d-table__cell --detail">
                  {{user.days_since}}
                </td>
              </tr>
            {{/each}}
          </tbody>
        </table>
      {{else}}
        <div class="mass-anonymize__empty-state">
          <p>{{i18n "mass_anonymize.no_eligible_users"}}</p>
        </div>
      {{/if}}
    {{/unless}}
  </div>
</template>
