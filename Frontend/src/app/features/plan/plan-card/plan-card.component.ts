import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Plan } from '../../../models/plan.model';

@Component({
  selector: 'app-plan-card',
  standalone: false,
  templateUrl: './plan-card.component.html',
  styleUrls: ['./plan-card.component.css']
})
export class PlanCardComponent {
  @Input() plan!: Plan;

  @Output() open = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();

  openPlan() {
    this.open.emit();
  }

  deletePlan() {
    if (confirm('Biztos törlöd a tervet?')) {
      this.delete.emit();
    }
  }
}