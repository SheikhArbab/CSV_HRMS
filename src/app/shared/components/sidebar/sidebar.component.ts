import { AfterViewInit, Component, Inject, Injectable, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
declare const $: any;
@Injectable()
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, AfterViewInit {
  activRoute: string = '';
  adminItems: {name: string, route: string}[] = [
    {
      name: 'Company',
      route: '/admin/company-structure'
    },
    {
      name: 'Job Details Setup',
      route: '/admin/job-detail'
    },
    {
      name: 'Qualifications',
      route: '/admin/qualifications'
    },
    {
      name: 'Projects',
      route: '/admin/projects'
    },
    {
      name: 'Clients',
      route: '/admin/clients'
    },
  ]
  constructor(@Inject(DOCUMENT) private _document: Document, private _route: Router, public translate: TranslateService) {
    _route.events.subscribe((val) =>
      this.activRoute = _route.url
    )


  }

  ngAfterViewInit(): void {

  }

  ngOnInit(): void {

  }


}
