import Controller from "@ember/controller";
import EmberObject, { action } from "@ember/object";
import { tracked } from "@glimmer/tracking";

import { ajax } from "discourse/lib/ajax"


export default class AdminPluginsMassAnonymizeController extends Controller {
  @tracked eligibleUsers = [];

  @tracked isLoading = false;

  usersFetched = false;

  @action getUsers() {
    if ( this.usersFetched ) {
      return;
    }

    this.isLoading = true;
    const res = ajax("/mass-anonymize/admin.json");

    res.then(
      (res) => {
        const users = res;

        console.log(users);

        this.eligibleUsers = users.map((user) => {
          const then = new Date(user.last_seen_at)
          const now = new Date();
          const msPerDay = 1000 * 60 * 60 * 24;

          user.days_since = Math.floor((now - then) / msPerDay).toString() + " days";

          const result = EmberObject.create(user);

          return result;
        });
      }).catch((err) => console.error(err)).finally(() => {this.isLoading = false;});

  }
}
