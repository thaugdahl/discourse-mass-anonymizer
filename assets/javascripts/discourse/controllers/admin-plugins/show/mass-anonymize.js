import { tracked } from "@glimmer/tracking";
import Controller from "@ember/controller";
import EmberObject, { action } from "@ember/object";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
import { popupAjaxError } from "discourse/lib/ajax-error";
import { i18n } from "discourse-i18n";

class MAStates {
  static IDLE = 0;
  static SELECTED = 1;
  static IN_PROGRESS = 2;
  static ANONYMIZED = 3;

  static toggle(state) {
    if (state === MAStates.IDLE) {
      return MAStates.SELECTED;
    } else if (state === MAStates.SELECTED) {
      return MAStates.IDLE;
    } else {
      return state;
    }
  }
}

export default class AdminPluginsShowMassAnonymizeController extends Controller {
  @service dialog;

  @tracked eligibleUsers = [];
  @tracked isLoading = false;
  @tracked hasMore = false;

  // Keyset cursor for the server to seek past.
  get cursor() {
    const last = this.eligibleUsers[this.eligibleUsers.length - 1];
    if (!last) {
      return {};
    }
    return { last_seen_at: last.last_seen_at, last_id: last.id };
  }

  @action
  getUsers() {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    return ajax("/mass-anonymize/admin.json")
      .then((response) => {
        this.eligibleUsers = this._mapUsers(response.users ?? []);
        this.hasMore = response.has_more ?? false;
      })
      .catch(popupAjaxError)
      .finally(() => {
        this.isLoading = false;
      });
  }

  @action
  loadMore() {
    if (this.isLoading || !this.hasMore) {
      return;
    }

    this.isLoading = true;

    return ajax("/mass-anonymize/admin.json", { data: this.cursor })
      .then((response) => {
        this.eligibleUsers = [
          ...this.eligibleUsers,
          ...this._mapUsers(response.users ?? []),
        ];
        this.hasMore = response.has_more ?? false;
      })
      .catch(popupAjaxError)
      .finally(() => {
        this.isLoading = false;
      });
  }

  _mapUsers(users) {
    return users.map((user) => {
      const then = new Date(user.last_seen_at);
      const now = new Date();
      const msPerDay = 1000 * 60 * 60 * 24;

      user.days_since =
        Math.floor((now - then) / msPerDay).toString() + " days";

      return EmberObject.create({ ...user, maState: MAStates.IDLE });
    });
  }

  @action
  deselectAll() {
    this.eligibleUsers = this.eligibleUsers.map((user) => {
      if (user.maState === MAStates.SELECTED) {
        user.maState = MAStates.IDLE;
      }
      return EmberObject.create({ ...user });
    });
  }

  @action
  selectAll() {
    this.eligibleUsers = this.eligibleUsers.map((user) => {
      if (user.maState === MAStates.IDLE) {
        user.maState = MAStates.SELECTED;
      }
      return EmberObject.create({ ...user });
    });
  }

  isProcessing(user) {
    return user.maState === MAStates.IN_PROGRESS;
  }

  isDone(user) {
    return user.maState === MAStates.ANONYMIZED;
  }

  isChecked(user) {
    return user.maState === MAStates.SELECTED;
  }

  updateState(userId, state) {
    this.eligibleUsers = this.eligibleUsers.map((user) => {
      if (user.id === userId) {
        user.maState = state;
      }
      return EmberObject.create({ ...user });
    });
  }

  @action
  setSelected(targetUser) {
    const id = targetUser.id;
    this.eligibleUsers = this.eligibleUsers.map((user) => {
      if (user.id === id) {
        user.maState = MAStates.toggle(user.maState);
        return EmberObject.create({ ...user });
      }
      return user;
    });
  }

  @action
  anonymizeAll() {
    const selected = this.eligibleUsers.filter(
      (user) => user.maState === MAStates.SELECTED
    );

    if (selected.length === 0) {
      return;
    }

    this.dialog.confirm({
      message: i18n("mass_anonymize.confirm_anonymize", {
        count: selected.length,
      }),
      didConfirm: () => this._doAnonymizeAll(selected),
    });
  }

  async _doAnonymizeAll(selectedUsers) {
    const SEGMENT_SIZE = 5;
    const ids = selectedUsers.map((user) => user.id);
    let skipped = 0;

    for (let start = 0; start < ids.length; start += SEGMENT_SIZE) {
      const segment = ids.slice(start, start + SEGMENT_SIZE);
      segment.forEach((id) => this.updateState(id, MAStates.IN_PROGRESS));

      try {
        const data = await ajax("/mass-anonymize/anonymize.json", {
          type: "POST",
          contentType: "application/json",
          data: JSON.stringify({ users: segment }),
        });

        const anonymized = new Set(data?.anonymized_ids ?? []);
        for (const id of segment) {
          // Skipped ids return to IDLE rather than staying stuck on a spinner.
          this.updateState(
            id,
            anonymized.has(id) ? MAStates.ANONYMIZED : MAStates.IDLE
          );
        }
        skipped += segment.filter((id) => !anonymized.has(id)).length;
      } catch (err) {
        segment.forEach((id) => this.updateState(id, MAStates.IDLE));
        popupAjaxError(err);
        return;
      }
    }

    if (skipped > 0) {
      this.dialog.alert(i18n("mass_anonymize.some_skipped", { count: skipped }));
    }
  }
}
