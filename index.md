---
layout: page
title:  grijq by realistschuckle
---
# grijq

A ThemeRoller-ready data grid widget for jQuery UI that consumes normal HTML
tables.

## Pronunciation

Just say "gridge". The "q" is silent.

## Examples

* [A 1000-row grid built on demand with the theme switcher widget](examples/lots-of-rows.html)

## Usage

{% highlight html %}
  <table width="100" id="grid">
    <colgroup>
      <col width="55">
      <col width="45">
    </colgroup>
    <thead>
      <tr>
        <th>Song</th>
        <th>Length</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Code Monkey</td>
        <td>3:10</td>
      </tr>
      <tr>
        <td>Ikea</td>
        <td>3:05</td>
      </tr>
      <tr>
        <td>I Feel Fantastic</td>
        <td>3:06</td>
      </tr>
      <tr>
        <td>Mandelbrot Set</td>
        <td>4:22</td>
      </tr>
    </tbody>
  </table>
{% endhighlight %}

{% highlight javascript %}
  $('#grid').grijq();
{% endhighlight %}

## Motivation

I wanted a data grid that did not rely on JavaScript arrays and special APIs.
Instead, I wanted a grid that worked from a fully rendered HTML table that
something else could manage, like [knockout.js](http://knockoutjs.com). I
could not find any and, so, tackling the problem like a programmer, spent a
couple of days putting one together.

## Notes

On Chrome and Firefox, the parsing and rendering of a table takes no real
difference if your source contains a raw table or a pre-formatted table.

On Internet Explorer, the pre-formatted table takes an apreciably shorter time
to render.

## Works well on

* Chrome 19 for Windows
* Chrome 19 for OS X
* Firefox 13 for Windows
* Firefox 13 for OS X
* Internet Explorer 8 for Windows
* Internet Explorer 9 for Windows
* Opera 12 for Windows

## Does not work well on

Opera 12 for OS X
: It seems that Opera 12 can't even load the example page. The second 1000-row
  table seems to make it hang forever.

Internet Explorer 9 Compatibility View for Windows
: It seems that IE 9 CV does not honor the CSS that allows it to truncate text
  in the grid cells. So make sure to use the *X-UA-Compatible* `meta` tag to
  notify IE that the page is ok to render as itself.
