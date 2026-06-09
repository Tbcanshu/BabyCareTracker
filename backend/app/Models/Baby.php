<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Baby extends Model
{
    protected $fillable = ['user_id', 'name', 'date_of_birth', 'gender'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }
}
