import { tracked } from "@glimmer/tracking";
import Controller from "@ember/controller";
import EmberObject, { action } from "@ember/object";
import { service } from "@ember/service";
import { ajax } from "discourse/lib/ajax";
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
  @tracked currentPage = 1;
  @tracked totalCount = 0;

  usersFetched = false;

  get hasMore() {
    return this.eligibleUsers.length < this.totalCount;
  }

  setAnonymized(userId) {
    this.eligibleUsers = this.eligibleUsers.map((usr) => {
      const updated = { ...usr };
      if (userId === usr.id) {
        updated.maState = MAStates.ANONYMIZED;
      }
      return EmberObject.create({ ...updated });
    });
  }

  not(a) {
    return !a;
  }

  @action
  getUsers() {
    if (this.usersFetched) {
      return;
    }

    this.isLoading = true;
    this.currentPage = 1;

    ajax(`/mass-anonymize/admin.json?page=${this.currentPage}`)
      .then((response) => {
        this.totalCount = response.total_count ?? response.users?.length ?? 0;
        this.eligibleUsers = this._mapUsers(response.users ?? []);
        this.usersFetched = true;
      })
      .catch((err) => console.error(err)) // eslint-disable-line no-console
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
    this.currentPage += 1;

    ajax(`/mass-anonymize/admin.json?page=${this.currentPage}`)
      .then((response) => {
        this.eligibleUsers = [
          ...this.eligibleUsers,
          ...this._mapUsers(response.users ?? []),
        ];
      })
      .catch((err) => {
        this.currentPage -= 1;
        console.error(err); // eslint-disable-line no-console
      })
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
      user.maState = MAStates.SELECTED;
      return EmberObject.create({ ...user });
    });
  }

  isProcessing(user) {
    return user.maState >= MAStates.IN_PROGRESS;
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
      message: i18n("mass_anonymize.confirm_anonymize", { count: selected.length }),
      didConfirm: () => this._doAnonymizeAll(selected),
    });
  }

  _doAnonymizeAll(selectedUsers) {
    const SEGMENT_SIZE = 5;

    const allToAnonymize = selectedUsers.map((user) => user.id);
    const numToAnonymize = allToAnonymize.length;

    const shouldContinue = (segmentIdx) => {
      return segmentIdx * SEGMENT_SIZE < numToAnonymize;
    };

    const applySequence = (segmentIdx) => {
      const segmentStart = segmentIdx * SEGMENT_SIZE;
      const segment = allToAnonymize.slice(segmentStart, segmentStart + SEGMENT_SIZE);

      segment.forEach((id) => {
        this.updateState(id, MAStates.IN_PROGRESS);
      });

      ajax("/mass-anonymize/anonymize.json", {
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify({ users: segment }),
      })
        .then((data) => {
          data?.anonymizedIds.forEach((id) => {
            this.updateState(id, MAStates.ANONYMIZED);
          });

          if (shouldContinue(segmentIdx + 1)) {
            applySequence(segmentIdx + 1);
          }
        })
        .catch(() => {
          segment.forEach((id) => this.updateState(id, MAStates.IDLE));
        });
    };

    applySequence(0);
  }
}
