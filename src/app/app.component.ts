import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  ngOnInit() {
    console.clear();

    const styles = "font-size: 1.25rem; border-radius: .25rem; padding-inline: .25rem; color: #f5f5f5; background-color: #3C84A0";
    console.log("%cMade by: Maksym Pavlii", styles);
  }

  title = 'ChatApp';
}
