import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxFileDropModule, NgxFileDropEntry } from 'ngx-file-drop';
import { ToastrService } from 'ngx-toastr';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { ApiCallingService } from '../../shared/Services/api-calling.service';
import { DataShareService } from '../../shared/Services/data-share.service';
import { UserAuthenticationService } from '../../shared/Services/user-authentication.service';
import { NgbDate, NgbDatepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { AddEditSupplierComponent } from '../../configuration-module/add-edit-supplier/add-edit-supplier.component';
import { NgSelectModule } from '@ng-select/ng-select';
import { TranslateModule } from '@ngx-translate/core';
declare const $: any;

@Component({
  selector: 'app-add-edit-purchase-invoice',
  standalone: true,
  imports: [NgxFileDropModule, CommonModule, FormsModule, ReactiveFormsModule, AddEditSupplierComponent, NgbDatepickerModule, NgSelectModule, TranslateModule],
  templateUrl: './add-edit-purchase-invoice.component.html',
  styleUrl: './add-edit-purchase-invoice.component.css'
})
export class AddEditPurchaseInvoiceComponent {
  files: NgxFileDropEntry[] = [];
  imageObject: any = [];
  ngUnsubscribe = new Subject<void>();
  _subscription: Subscription;
  purchaseInvoiceForm!: FormGroup;
  isEdit: boolean = false;
  selectedInvoice: any;
  attachedFiles: any[] = [];
  supplierList: any[] = [];
  managerList: any[] = [];
  selectedFile: any;

  constructor(
    private _router: Router,
    private _toaster: ToastrService,
    private _fb: FormBuilder,
    private _apiCalling: ApiCallingService,
    private _authService: UserAuthenticationService,
    private _route: ActivatedRoute,
    private _sanitizer: DomSanitizer,
    private _dataShare: DataShareService,
    @Inject(PLATFORM_ID) private platformId: Object) {
    this._route.queryParams.subscribe(params => {
      this.isEdit = false;
      this.selectedInvoice = {};
      if (params['invoiceId'] !== undefined && params['invoiceId'] !== null && params['invoiceId'] !== '' && params['invoiceId'] !== 0) {
        this.isEdit = true;
        if (isPlatformBrowser(this.platformId)) {
          this.selectedInvoice = JSON.parse(localStorage.getItem('invoice')!);
        }

      }
    });

    this._subscription = this._dataShare.$shareSupplierId.subscribe(supplierId => {
      if (supplierId !== 0) {
        this.getSupplier(supplierId);
      }
    });

    this.purchaseInvoiceForm = this._fb.group(
      {
        receiptDate: [new NgbDate(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate())],
        selectedId: ['', [Validators.required]],
        invoiceNumber: ['', [Validators.required]],
        assignedTo: ['', [Validators.required]],
        totalBeforeVat: ['', [Validators.required]],
        vat: ['15', [Validators.required]],
        totalWithVat: ['', [Validators.required]],
        remarks: [''],
      });

  }

  ngOnInit(): void {
    this.getSupplier(0);
    this.getManager();
    this.prefilledForm();
  }

  prefilledForm(): void {
    if (!this.isEdit)
      return;

    this.purchaseInvoiceForm.patchValue({
      invoiceNumber: this.selectedInvoice.invoiceNumber,
      receiptDate: new NgbDate(new Date(this.selectedInvoice.receiptDate).getFullYear(), new Date(this.selectedInvoice.receiptDate).getMonth() + 1, new Date(this.selectedInvoice.receiptDate).getDate()),
      selectedId: this.selectedInvoice.id,
      assignedTo: this.selectedInvoice.assignedTo,
      totalBeforeVat: this.selectedInvoice.totalBeforeVat,
      vat: this.selectedInvoice.vat,
      totalWithVat: this.selectedInvoice.totalWithVat,
      remarks: this.selectedInvoice.remarks,
    });
    this.selectedInvoice?.invoicesMediaInformation.forEach((element: any) => {
      this.attachedFiles.push({
        name: element.fileName,
        url: this._sanitizer.bypassSecurityTrustResourceUrl(element.mediaUrl)
      })
    });
    this.getSelectedFile(0);
  }

  getSupplier(supplierId: any): void {
    this._apiCalling.getData("supplier", "", true)
      .pipe(takeUntil(this.ngUnsubscribe)).subscribe({
        next: (response) => {
          if (response?.success) {
            this.supplierList = response.data;
            this.supplierList.push({ supplierId: 0, name: 'Other' });
            if (supplierId !== 0) {
              this.purchaseInvoiceForm.controls['selectedId'].setValue(supplierId);
              $('#addSupplierModal').modal('hide');
            }
          } else {
            this._toaster.error(response?.message, 'Error!');
          }
        },
        error: (error) => {
          this._toaster.error("Internal server error occured while processing your request")
        }
      })
  }

  getManager(): void {
    this._apiCalling.getData("user", "manager", true)
      .pipe(takeUntil(this.ngUnsubscribe)).subscribe({
        next: (response) => {
          if (response?.success) {
            this.managerList = response.data;
          } else {
            this._toaster.error(response?.message, 'Error!');
          }
        },
        error: (error) => {
          this._toaster.error("Internal server error occured while processing your request")
        }
      })
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('invoice');
    }

  }

  submitForm(): void {

    if (!this.purchaseInvoiceForm.valid) {
      return;
    }

    if (!this.isEdit) {
      var formData = new FormData();
      formData.append('invoiceType', '1');
      formData.append('selectedId', this.purchaseInvoiceForm.get('selectedId')?.value);
      formData.append('receiptDate', `${this.purchaseInvoiceForm.get('receiptDate')?.value.year}-${this.purchaseInvoiceForm.get('receiptDate')?.value.month}-${this.purchaseInvoiceForm.get('receiptDate')?.value.day}`);
      formData.append('invoiceNumber', this.purchaseInvoiceForm.get('invoiceNumber')?.value);
      formData.append('totalBeforeVat', this.purchaseInvoiceForm.get('totalBeforeVat')?.value);
      formData.append('vat', this.purchaseInvoiceForm.get('vat')?.value);
      formData.append('totalWithVat', this.purchaseInvoiceForm.get('totalWithVat')?.value);
      formData.append('assignedTo', this.purchaseInvoiceForm.get('assignedTo')?.value);
      formData.append('remarks', this.purchaseInvoiceForm.get('remarks')?.value);
      formData.append('actionBy', String(this._authService.getUserId()));
      this.attachedFiles.forEach(function (obj: any, index: any) {
        formData.append(`attachments`, obj.file);
      });

      this._apiCalling.postData("invoice", "add", formData, true)
        .pipe(takeUntil(this.ngUnsubscribe)).subscribe({
          next: (response) => {
            if (response?.success) {
              this._toaster.success(response?.message, 'Success!');
              this.back();

            } else {
              this._toaster.error(response?.message, 'Error!');
            }
          },
          error: (error) => {
            this._toaster.error("Internal server error occured while processing your request")
          }
        })
    } else {

      var formData = new FormData();
      formData.append('invoiceType', '1');
      formData.append('selectedId', this.purchaseInvoiceForm.get('selectedId')?.value);
      formData.append('receiptDate', `${this.purchaseInvoiceForm.get('receiptDate')?.value.year}-${this.purchaseInvoiceForm.get('receiptDate')?.value.month}-${this.purchaseInvoiceForm.get('receiptDate')?.value.day}`);
      formData.append('invoiceNumber', this.purchaseInvoiceForm.get('invoiceNumber')?.value);
      formData.append('totalBeforeVat', this.purchaseInvoiceForm.get('totalBeforeVat')?.value);
      formData.append('vat', this.purchaseInvoiceForm.get('vat')?.value);
      formData.append('totalWithVat', this.purchaseInvoiceForm.get('totalWithVat')?.value);
      formData.append('assignedTo', this.purchaseInvoiceForm.get('assignedTo')?.value);
      formData.append('remarks', this.purchaseInvoiceForm.get('remarks')?.value);
      formData.append('actionBy', String(this._authService.getUserId()));
      this.attachedFiles.forEach(function (obj: any, index: any) {
        formData.append(`attachments`, obj.file);
      });

      this._apiCalling.putData("invoice", "edit/" + this.selectedInvoice.invoiceId + "", formData, true)
        .pipe(takeUntil(this.ngUnsubscribe)).subscribe({
          next: (response) => {
            if (response?.success) {
              this._toaster.success(response?.message, 'Success!');
              this.back();

            } else {
              this._toaster.error(response?.message, 'Error!');
            }
          },
          error: (error) => {
            this._toaster.error("Internal server error occured while processing your request")
          }
        })
    }

  }

  droppedFiles(files: NgxFileDropEntry[]) {
    this.files = files;
    for (const droppedFile of files) {
      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file((file: File) => {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const arrayBuffer = e.target.result as ArrayBuffer;
            const fileBlob = new Blob([new Uint8Array(arrayBuffer)], { type: file?.type });
            this.attachedFiles.push(
              {
                file: file,
                name: file.name,
                type: file.type,
                fileBlob: fileBlob,
                url: this._sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(fileBlob))
              }

            );
            console.log('File Blob:', fileBlob);
          };
          reader.readAsArrayBuffer(file);
        });
      }
    }
    this.getSelectedFile(0);
  }

  getSelectedFile(index: number): void {
    this.selectedFile = this.attachedFiles[index];
  }

  addSupplierModal(): void {
    if (this.purchaseInvoiceForm.get('selectedId')?.value === '')
      return;

    if (Number(this.purchaseInvoiceForm.get('selectedId')?.value) === 0) {
      $('#addSupplierModal').modal('show');
    }
  }

  removeAttachment(index: number): void {
    this.attachedFiles.splice(index, 1);
  }

  back(): void {
    this._router.navigate([`${'/invoice/purchase-invoices'}`]);
  }

  calculateTotal(): void {
    var total = Math.floor(Number(this.purchaseInvoiceForm.get('totalBeforeVat')?.value) + ((this.purchaseInvoiceForm.get('totalBeforeVat')?.value) * (Number(this.purchaseInvoiceForm.get('vat')?.value) / 100)));
    this.purchaseInvoiceForm.patchValue({
      totalWithVat: total,
    });
  }

}
