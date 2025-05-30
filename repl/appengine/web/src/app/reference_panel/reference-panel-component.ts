/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Component } from '@angular/core';
import { ReplExampleService, Example } from '../shared/repl-example-service';

const examples = new Map<string, Example>([
  ["hello-world",
  {
    "request": {
      commands: [
        `"hello world!"`
      ]
    }
  }],
  ["variables", {
    "request": {
      commands: [
        `%let x = 10`,
        `x + 2`,
      ]
    }
  }],
  ["errors", {
    "request": {
      commands: [
        `%let x = 0`,
        `false || 10 / x > 5`,
        `true || 10 / x > 5`,
        `10 / x > 5 || false`,
        `10 / x > 5 || true`,
      ]
    }
  }],
  ["extension-functions", {
    "request": {
      commands: [
        `%let string.prepend(prefix: string) : string -> prefix + this`,
        `"def".prepend("abc")`,
        `%let exp(base: double, exponent: int) : double ->
          {-2: 1.0 / base / base,
           -1: 1.0 / base,
           0: 1.0,
           1: base,
           2: base * base
          }[exponent]`,
        `exp(2.0, -2) == 0.25`,
      ]
    }
  }],
  ["json", {
    "request": {
      commands: [
        `%let now = timestamp("2001-01-01T00:00:01Z")`,
        `%let sa_user = "example-service"`,
        `{'aud': 'my-project',
          'exp': now + duration('300s'),
          'extra_claims': {
            'group': 'admin'
          },
          'iat': now,
          'iss': 'auth.acme.com:12350',
          'nbf': now,
          'sub': 'serviceAccount:' + sa_user + '@acme.com'
        }`
      ]
    }
  }],
  ["structs", {
    "request": {
      commands: [
        `%load_descriptors --pkg 'google-rpc'`,
        `%option --container "google.rpc.context"`,
        `%let now = timestamp("2001-01-01T00:00:01Z")`,
        `%let sa_user = "example-service"`,
        `AttributeContext.Request{
          auth: AttributeContext.Auth{
            principal: sa_user,
            audiences: ['my-project'],
          },
          time: now
        }`
      ]
    }
  }],
  ["macros", {
    "request": {
      commands: [
        `[1, 2, 3, 4].exists(x, x > 3)`,
        `[1, 2, 3, 4].all(x, x < 4)`,
        `[1, 2, 3, 4].exists_one(x, x % 2 == 0)`,
        `[1, 2, 3, 4].filter(x, x % 2 == 0)`,
        `[1, 2, 3, 4].map(x, x * x)`,
        `{'abc': 1, 'def': 2}.exists(key, key == 'def')`,
      ]
    }
  }],
  ["partial-evaluations", {
    "request": {
      commands: [
        `%option --enable_partial_eval`,
        `%declare unk_a : bool`,
        `%declare unk_b : bool`,
        `%let err = 1 / 0 > 2`,
        `true || false`,
        `true || unk_a`,
        `true || err`,
        `false || unk_a`,
        `false || err`,
        `unk_a || true`,
        `unk_a || false`,
        `unk_a || err`,
        `unk_a || unk_a`,
        `unk_a || unk_b`,
        `unk_a || true || err`,
      ]
    }
  }],
  ["optionals",
  {
    request: {
      commands: [
        `%option --extension "optional"`,
        `%let x = optional.of("one")`,
        `%let y = optional.ofNonZeroValue("")  // to infer optional(string)`,
        `{?1: x, ?2: y}  // optional construction`,
        `optional.none().orValue(true)`,
        `optional.of(2).optMap(x, x * 2).orValue(1)`,
        `{}[?'key'].orValue(10)`,
        `%let values = {1: 2, 2: 4, 3: 6}`,
        `optional.ofNonZeroValue(1).optFlatMap(x, values[?x]).value()`,
        `optional.none().hasValue()`
      ]
    }
  }],
  [
    "strings",
  {
    request: {
      commands: [
        `%option --extension "strings"`,
        `"%s_%s_0x0%x".format([false, 5.0e20, 15])`,
        `["a", "b", "c"].join("-")`,
        `"123".reverse()`,
        `"  abc  ".trim()`,
      ]
    }
  }],
  [
    "math",
  {
    request: {
      commands: [
        `%option --extension "math"`,
        `math.least(-42, 40, 20)`,
        `math.least(-42, 40u, -20e2)`,
        `math.greatest([1, 2, 3, 4, 5])`,
      ]
    }
  }],
  [
    "bind",
  {
    request: {
      commands: [
        `%option --extension "bindings"`,
        `cel.bind(x, 20, x * x)`,
        `cel.bind(allow, [1, 2, 3, 4], [3, 2, 1, 1, 4].all(x, x in allow))`
      ]
    }
  }],
  [
    "cel-spec-test",
  {
    request: {
      commands: [
        `%load_descriptors --pkg 'cel-spec-test-types'`,
        `%option --container "cel.expr.conformance"`,
        `%let pb3 = proto3.TestAllTypes{}`,
        `%let pb2 = proto2.TestAllTypes`,
        `pb3 == proto3.TestAllTypes{}`
      ]
    }
  }],
]);

/**
 * Reference panel for REPL.
 * Provides links to information about CEL and the REPL mini-language.
 */
@Component({
  standalone: false,
  selector: 'app-reference-panel',
  templateUrl: './reference-panel-component.html',
  styleUrls: ['./reference-panel-component.scss']
})
export class ReferencePanelComponent {
  constructor(private readonly exampleService: ReplExampleService){}

  startExample(id: string) {
    const example = examples.get(id);
    if (example) {
      this.exampleService.postExample(example);
    } else {
      console.error("unknown example id: ", id);
    }
  }
}
